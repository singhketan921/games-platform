import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_TENANT_API_URL || "http://localhost:4000";

async function loginAction(formData) {
  "use server";

  const tenantId = formData.get("tenantId")?.toString().trim();
  const rawEmail = formData.get("email");
  const email = rawEmail ? rawEmail.toString().trim().toLowerCase() : "";
  const password = formData.get("password")?.toString().trim();
  const redirectTo = formData.get("redirect")?.toString() || "/tenant";

  if (!tenantId || !email || !password) {
    redirect(
      `/tenant/login?error=${encodeURIComponent("All fields are required")}&redirect=${encodeURIComponent(
        redirectTo
      )}`
    );
  }

  let payload = null;
  try {
    const response = await fetch(`${API_BASE_URL}/tenant/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, email, password }),
      cache: "no-store",
    });
    payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      const message = payload?.error || "Invalid credentials";
      redirect(
        `/tenant/login?error=${encodeURIComponent(message)}&redirect=${encodeURIComponent(
          redirectTo
        )}`
      );
    }
  } catch (error) {
    redirect(
      `/tenant/login?error=${encodeURIComponent(
        "Unable to reach platform API"
      )}&redirect=${encodeURIComponent(redirectTo)}`
    );
  }

  const { credentials, tenant, user } = payload;

  if (!credentials?.apiKey || !credentials?.apiSecret) {
    redirect(
      `/tenant/login?error=${encodeURIComponent(
        "Tenant credentials missing"
      )}&redirect=${encodeURIComponent(redirectTo)}`
    );
  }

  const cookieStore = cookies();
  const cookieOptions = {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  };

  cookieStore.set("tenant-auth", "1", cookieOptions);
  cookieStore.set("tenant-key", credentials.apiKey, cookieOptions);
  cookieStore.set("tenant-secret", credentials.apiSecret, cookieOptions);

  if (tenant?.id) {
    cookieStore.set("tenant-id", tenant.id, cookieOptions);
  }
  if (user?.role) {
    cookieStore.set("tenant-user-role", user.role, cookieOptions);
  }
  if (user?.id) {
    cookieStore.set("tenant-user-id", user.id, cookieOptions);
  }

  redirect(redirectTo);
}

export default async function TenantLoginPage({ searchParams }) {
  const resolvedParams = (await searchParams) ?? {};
  const error = resolvedParams.error;
  const redirectTo = resolvedParams.redirect
    ? decodeURIComponent(resolvedParams.redirect)
    : "/tenant";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md bg-white shadow-xl p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenant Portal</p>
          <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
        </div>

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="redirect" value={redirectTo} />
          <div>
            <label className="label">
              <span className="label-text">Tenant ID</span>
            </label>
            <input
              name="tenantId"
              className="input input-bordered w-full"
              placeholder="tenant_cmi..."
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              name="email"
              type="email"
              className="input input-bordered w-full"
              placeholder="ops@tenant.com"
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input name="password" type="password" className="input input-bordered w-full" required />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Sign In
          </button>
        </form>

        {error && (
          <div role="alert" className="alert alert-error text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
