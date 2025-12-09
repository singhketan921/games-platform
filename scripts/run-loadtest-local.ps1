param(
    [string]$ApiPort = "4100",
    [string]$DatabaseUrl = "postgresql://postgres:password@localhost:5432/games_platform",
    [int]$Vus = 15,
    [string]$Duration = "120s",
    [double]$SleepSeconds = 0.05,
    [string]$PlayerPrefix = "k6-player",
    [string]$BetAmount = "25",
    [double]$PayoutMultiplier = 0.92,
    [switch]$StopDockerWhenDone
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path "$PSScriptRoot/..").Path
Set-Location $repoRoot

function Wait-UntilHealthy {
    param(
        [string]$Url,
        [int]$Attempts = 40
    )

    for ($i = 0; $i -lt $Attempts; $i++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                return
            }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }

    throw "API failed health check at $Url"
}

Write-Host "Ensuring Postgres container is running (docker compose up -d postgres)..."
docker compose up -d postgres | Out-Host

# Sync schema and seed deterministic data
$env:DATABASE_URL = $DatabaseUrl
npx prisma db push --skip-generate | Out-Host

Write-Host "Seeding load-test tenant + wallet config (mock mode)..."
node scripts/seed/loadtest.js --wallet-mode=mock | Out-Host

Write-Host "Starting mock wallet server..."
$walletJob = Start-Job -ScriptBlock {
    param($repo)
    Set-Location $repo
    node scripts/mock-wallet-server.js
} -ArgumentList $repoRoot

Write-Host "Starting API on port $ApiPort..."
$serverJob = Start-Job -ScriptBlock {
    param($repo, $port, $db)
    $env:PORT = $port
    $env:DATABASE_URL = $db
    Set-Location $repo
    node app.js
} -ArgumentList $repoRoot, $ApiPort, $DatabaseUrl

Wait-UntilHealthy -Url "http://localhost:$ApiPort/health"

$k6PathCandidate = Join-Path $repoRoot "tools/k6/k6-v1.4.2-windows-amd64"
if (Test-Path $k6PathCandidate) {
    $env:PATH = "$k6PathCandidate;$env:PATH"
}

$env:API_BASE_URL = "http://localhost:$ApiPort"
$env:TENANT_API_KEY = "044aae64a33a86bf29d811c3d7cf8043"
$env:TENANT_SECRET = "548ac7141a53ceb18614f8c2c3c6b31e5286826046cc7883eb5235a93a369b67"
$env:TENANT_USER_ID = "cmix7jsnm0001u8xwem0jhblg"
$env:VUS = $Vus
$env:DURATION = $Duration
$env:SLEEP_SECONDS = $SleepSeconds
$env:PLAYER_PREFIX = $PlayerPrefix
$env:BET_AMOUNT = $BetAmount
$env:PAYOUT_MULTIPLIER = $PayoutMultiplier
$env:K6_SUMMARY_TREND_STATS = "avg,min,med,p(90),p(95),p(99),max"

$exitCode = 1
try {
    Write-Host "Running k6 scenario via npm run load:test..."
    npm run load:test
    $exitCode = $LASTEXITCODE
} finally {
    Write-Host "Stopping helper services and restoring wallet config..."
    node scripts/seed/loadtest.js --wallet-mode=httpbin | Out-Host

    foreach ($job in @($walletJob, $serverJob)) {
        if ($job) {
            Stop-Job $job -ErrorAction SilentlyContinue
            Receive-Job $job -ErrorAction SilentlyContinue | Out-Null
            Remove-Job $job -ErrorAction SilentlyContinue
        }
    }

    if ($StopDockerWhenDone) {
        Write-Host "Stopping postgres container..."
        docker compose stop postgres | Out-Host
    }
}

exit $exitCode
