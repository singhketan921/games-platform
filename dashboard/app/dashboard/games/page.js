import Link from "next/link";
import ErrorBox from "../../components/ErrorBox";
import { launchGame } from "../../../src/lib/api";

export default async function GamesPage({ searchParams = {} }) {
    const playerId = (searchParams.playerId || "").trim();
    const gameId = (searchParams.gameId || "").trim();
    const betAmount = (searchParams.betAmount || "").trim();
    const shouldLaunch = playerId && gameId && betAmount;

    let launchResult = null;
    let error = "";

    if (shouldLaunch) {
        try {
            launchResult = await launchGame({
                playerId,
                gameId,
                betAmount: Number(betAmount),
            });
        } catch (err) {
            error = err.message;
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Launch Game</h1>
                    <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
                        Back to overview
                    </Link>
                </div>
                <form className="mt-4 grid gap-3 md:grid-cols-3" method="get">
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-500">Player ID</label>
                        <input
                            name="playerId"
                            defaultValue={playerId}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="player-123"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-500">Game ID</label>
                        <input
                            name="gameId"
                            defaultValue={gameId}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="game-abc"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase text-gray-500">Bet Amount</label>
                        <input
                            name="betAmount"
                            defaultValue={betAmount}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="25"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Launch Game
                        </button>
                    </div>
                </form>
                <p className="mt-3 text-xs text-gray-500">
                    Sending this form submits the parameters through the secure action and shows the launch URL below.
                </p>
            </div>

            {error && <ErrorBox message={error} />}

            {launchResult && (
                <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold text-green-700">Launch successful</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Launch URL</p>
                    <p className="break-all text-blue-600">{launchResult.launchUrl ?? JSON.stringify(launchResult)}</p>
                </div>
            )}
        </div>
    );
}
