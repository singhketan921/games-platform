import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getAdminTenants,
  updateAdminTenant,
  updateAdminTenantStatus,
  rotateAdminTenantCredential,
  getAdminTenantWalletConfig,
  updateAdminTenantWalletConfig,
  updateAdminTenantGame,
  getAdminTenantUsers,
  createAdminTenantUser,
  updateAdminTenantUserStatus,
  resetAdminTenantUserPassword,
  getAdminTenantIpAllowlist,
  addAdminTenantIpAllowlistEntry,
  deleteAdminTenantIpAllowlistEntry,
} from "../../../../src/lib/api";

const getFormString = (formData, key) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

async function saveTenant(formData) {
  "use server";

  const id = getFormString(formData, "id");
  const name = getFormString(formData, "name");
  const domain = getFormString(formData, "domain");
  const contactEmail = getFormString(formData, "contactEmail");
  const status = getFormString(formData, "status") || "active";

  if (!id) {
    throw new Error("Tenant id is required");
  }

  await updateAdminTenant(id, {
    name,
    domain,
    contactEmail,
    status,
  });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
  redirect(`/admin/tenants/${id}`);
}

async function toggleStatus(formData) {
  "use server";

  const id = getFormString(formData, "id");
  const nextStatus = getFormString(formData, "status");

  if (!id) {
    throw new Error("Tenant id is required");
  }

  if (!nextStatus) {
    throw new Error("Tenant status is required");
  }

  await updateAdminTenantStatus(id, nextStatus);

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
  redirect(`/admin/tenants/${id}`);
}

async function rotateCredential(formData) {
  "use server";

  const id = getFormString(formData, "id");

  if (!id) {
    throw new Error("Tenant id is required");
  }

  const result = await rotateAdminTenantCredential(id);
  const secret = result?.credentials?.clientSecret;
  const redirectPath = secret
    ? `/admin/tenants/${id}?rotatedSecret=${encodeURIComponent(secret)}`
    : `/admin/tenants/${id}`;

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
  redirect(redirectPath);
}

async function saveWalletConfig(formData) {
  "use server";

  const id = getFormString(formData, "id");
  const debitUrl = getFormString(formData, "debitUrl");
  const creditUrl = getFormString(formData, "creditUrl");
  const balanceUrl = getFormString(formData, "balanceUrl");
  const hmacSecret = getFormString(formData, "hmacSecret");
  const status = getFormString(formData, "walletStatus") || "active";

  if (!id || !debitUrl || !creditUrl || !balanceUrl || !hmacSecret) {
    throw new Error("All wallet fields are required");
  }

  await updateAdminTenantWalletConfig(id, {
    debitUrl,
    creditUrl,
    balanceUrl,
    hmacSecret,
    status,
  });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
}

async function addAllowlistEntryAction(formData) {
  "use server";

  const tenantId = getFormString(formData, "tenantId");
  const ipAddress = getFormString(formData, "ipAddress");
  const label = getFormString(formData, "label");

  if (!tenantId || !ipAddress) {
    throw new Error("Tenant id and IP address are required");
  }

  await addAdminTenantIpAllowlistEntry(tenantId, { ipAddress, label });
  revalidatePath(`/admin/tenants/${tenantId}`);
  redirect(`/admin/tenants/${tenantId}`);
}

async function deleteAllowlistEntryAction(formData) {
  "use server";

  const tenantId = getFormString(formData, "tenantId");
  const entryId = getFormString(formData, "entryId");

  if (!tenantId || !entryId) {
    throw new Error("Tenant id and entry id are required");
  }

  await deleteAdminTenantIpAllowlistEntry(tenantId, entryId);
  revalidatePath(`/admin/tenants/${tenantId}`);
  redirect(`/admin/tenants/${tenantId}`);
}

async function updateGameAssignment(formData) {
  "use server";

  const tenantId = getFormString(formData, "tenantId");
  const gameId = getFormString(formData, "gameId");
  const rtpProfile = getFormString(formData, "rtpProfile");
  const isActiveRaw = getFormString(formData, "isActive");

  if (!tenantId || !gameId) {
    throw new Error("Tenant and game id are required");
  }

  const payload = {};
  if (rtpProfile) payload.rtpProfile = rtpProfile;
  if (isActiveRaw) {
    payload.isActive = isActiveRaw === "true";
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("No updates provided");
  }

  await updateAdminTenantGame(tenantId, gameId, payload);

  revalidatePath(`/admin/tenants/${tenantId}`);
  revalidatePath("/admin/tenants");
}

async function createTenantUserAction(formData) {
  "use server";

  const tenantId = getFormString(formData, "tenantId");
  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormString(formData, "password");
  const role = (getFormString(formData, "role") || "OPERATOR").toUpperCase();

  if (!tenantId || !email || !password) {
    throw new Error("Tenant, email, and password are required");
  }

  await createAdminTenantUser(tenantId, { email, password, role });

  revalidatePath(`/admin/tenants/${tenantId}`);
  redirect(`/admin/tenants/${tenantId}`);
}

async function toggleTenantUserStatus(formData) {
  "use server";

  const tenantId = getFormString(formData, "tenantId");
  const userId = getFormString(formData, "userId");
  const status = getFormString(formData, "status");

  if (!tenantId || !userId || !status) {
    throw new Error("Tenant, user, and status are required");
  }

  await updateAdminTenantUserStatus(tenantId, userId, status);
  revalidatePath(`/admin/tenants/${tenantId}`);
  redirect(`/admin/tenants/${tenantId}`);
}

async function resetTenantUserPasswordAction(formData) {
  "use server";

  const tenantId = getFormString(formData, "tenantId");
  const userId = getFormString(formData, "userId");
  const password = getFormString(formData, "password");

  if (!tenantId || !userId || !password) {
    throw new Error("Tenant, user, and new password are required");
  }

  await resetAdminTenantUserPassword(tenantId, userId, password);
  revalidatePath(`/admin/tenants/${tenantId}`);
  redirect(`/admin/tenants/${tenantId}`);
}

export default async function TenantEditPage({ params, searchParams } = {}) {
  const resolvedParams = (await params) ?? {};
  const resolvedSearch = (await searchParams) ?? {};
  const { id } = resolvedParams;
  const data = await getAdminTenants();
  const tenants = data.tenants || [];
  const tenant = tenants.find((t) => t.id === id);
  const [walletConfigPayload, tenantUsersPayload, allowlistPayload] = await Promise.all([
    getAdminTenantWalletConfig(id),
    getAdminTenantUsers(id).catch(() => null),
    getAdminTenantIpAllowlist(id).catch(() => null),
  ]);
  const walletConfig = walletConfigPayload?.config;
  const walletLogs = walletConfigPayload?.logs || [];
  const gameAssignments = tenant.gameAssignments || [];
  const tenantUsers = tenantUsersPayload?.users || [];
  const allowlistEntries = allowlistPayload?.entries || [];
  const rotatedSecret = resolvedSearch.rotatedSecret
    ? decodeURIComponent(resolvedSearch.rotatedSecret)
    : "";

  if (!tenant) {
    notFound();
  }

  const isActive = tenant.status === "active";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
            Tenant Management
          </p>
          <h1 className="text-3xl font-bold text-slate-900">{tenant.name}</h1>
          <p className="text-sm text-slate-600">Tenant ID: {tenant.id}</p>
        </div>
        <Link href="/admin/tenants" className="btn btn-outline btn-sm">
          Back to Tenants
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card bg-base-100 shadow-md rounded-xl md:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-lg font-semibold">
              Edit Tenant Details
            </h2>
            <form action={saveTenant} className="space-y-4 mt-4">
              <input type="hidden" name="id" value={tenant.id} />

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tenant Name</span>
                </label>
                <input
                  name="name"
                  defaultValue={tenant.name}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Domain</span>
                </label>
                <input
                  name="domain"
                  defaultValue={tenant.domain || ""}
                  className="input input-bordered"
                  placeholder="example.com"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contact Email</span>
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={tenant.contactEmail || ""}
                  className="input input-bordered"
                  placeholder="admin@example.com"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Status</span>
                </label>
                <select
                  name="status"
                  defaultValue={tenant.status}
                  className="select select-bordered"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-base-100 shadow-md rounded-xl">
            <div className="card-body space-y-2">
              <h2 className="card-title text-sm font-semibold text-slate-700">
                Status
              </h2>
              <span
                className={`badge ${
                  isActive ? "badge-success" : "badge-error"
                } w-fit`}
              >
                {tenant.status}
              </span>
              <form action={toggleStatus} className="pt-2">
                <input type="hidden" name="id" value={tenant.id} />
                <input
                  type="hidden"
                  name="status"
                  value={isActive ? "suspended" : "active"}
                />
                <button
                  type="submit"
                  className={`btn btn-sm ${
                    isActive ? "btn-warning" : "btn-success"
                  }`}
                >
                  {isActive ? "Suspend Tenant" : "Activate Tenant"}
                </button>
              </form>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md rounded-xl">
            <div className="card-body space-y-3">
              <h2 className="card-title text-sm font-semibold text-slate-700">
                OAuth Credentials
              </h2>
              <div className="text-sm space-y-1">
                <p className="text-slate-500">Client ID</p>
                <code className="text-xs break-all">
                  {tenant.oauthClientId || "Unavailable"}
                </code>
              </div>
              {rotatedSecret ? (
                <div className="alert alert-warning text-xs">
                  <p className="font-semibold">New Client Secret</p>
                  <code className="break-all">{rotatedSecret}</code>
                  <p className="mt-1">
                    Copy this secret now. It will not be shown again.
                  </p>
                </div>
              ) : null}
              <form action={rotateCredential} className="pt-2">
                <input type="hidden" name="id" value={tenant.id} />
                <button type="submit" className="btn btn-sm btn-outline">
                  Rotate Secret
                </button>
              </form>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md rounded-xl">
            <div className="card-body space-y-4">
              <h2 className="card-title text-sm font-semibold text-slate-700">
                Wallet Integration
              </h2>
              <form action={saveWalletConfig} className="space-y-3">
                <input type="hidden" name="id" value={tenant.id} />
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Debit URL</span>
                  </label>
                  <input
                    name="debitUrl"
                    defaultValue={walletConfig?.debitUrl || ""}
                    className="input input-bordered input-sm"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Credit URL</span>
                  </label>
                  <input
                    name="creditUrl"
                    defaultValue={walletConfig?.creditUrl || ""}
                    className="input input-bordered input-sm"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Balance URL</span>
                  </label>
                  <input
                    name="balanceUrl"
                    defaultValue={walletConfig?.balanceUrl || ""}
                    className="input input-bordered input-sm"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">HMAC Secret</span>
                  </label>
                  <input
                    name="hmacSecret"
                    type="password"
                    className="input input-bordered input-sm"
                    placeholder="Enter new secret"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="walletStatus"
                    defaultValue={walletConfig?.status || "active"}
                    className="select select-bordered select-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Wallet Config
                </button>
              </form>
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-slate-700">Recent Wallet Logs</p>
                <div className="max-h-48 overflow-y-auto border border-base-200 rounded-lg">
                  <table className="table table-compact text-xs">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Code</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{log.type}</td>
                          <td>
                            <span
                              className={`badge badge-sm ${
                                log.status === "SUCCESS" ? "badge-success" : "badge-error"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td>{log.responseCode || "-"}</td>
                          <td>{new Date(log.createdAt).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                      {walletLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-slate-500 py-4">
                            No wallet activity logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md rounded-xl">
            <div className="card-body space-y-4">
              <h2 className="card-title text-sm font-semibold text-slate-700">
                IP Allowlist
              </h2>
              <p className="text-xs text-slate-500">
                When set, tenant API calls must originate from these IPv4/IPv6 values. Leave empty to allow any IP.
              </p>

              <div className="overflow-x-auto border border-base-200 rounded-lg">
                <table className="table table-compact text-xs">
                  <thead>
                    <tr>
                      <th>IP Address</th>
                      <th>Label</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {allowlistEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="font-mono">{entry.ipAddress}</td>
                        <td>{entry.label || "-"}</td>
                        <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}</td>
                        <td>
                          <form action={deleteAllowlistEntryAction}>
                            <input type="hidden" name="tenantId" value={tenant.id} />
                            <input type="hidden" name="entryId" value={entry.id} />
                            <button type="submit" className="btn btn-xs btn-error btn-outline">
                              Remove
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {!allowlistEntries.length && (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-500 py-4">
                          No IP restrictions. All traffic is allowed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <form action={addAllowlistEntryAction} className="space-y-3">
                <input type="hidden" name="tenantId" value={tenant.id} />
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">IP Address</span>
                  </label>
                  <input
                    name="ipAddress"
                    className="input input-bordered input-sm"
                    placeholder="e.g. 203.0.113.7"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Label (optional)</span>
                  </label>
                  <input
                    name="label"
                    className="input input-bordered input-sm"
                    placeholder="VPN Gateway"
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-primary w-full">
                  Add IP
                </button>
              </form>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md rounded-xl">
            <div className="card-body space-y-4">
              <h2 className="card-title text-sm font-semibold text-slate-700">
                Tenant Users
              </h2>
              <div className="text-xs text-slate-500">
                Operators authenticate to the tenant portal with these accounts.
              </div>
              <div className="overflow-x-auto">
                <table className="table table-compact text-xs">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="font-mono">{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              user.status === "active" ? "badge-success" : "badge-error"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td>
                          <form action={toggleTenantUserStatus} className="flex items-center gap-2">
                            <input type="hidden" name="tenantId" value={tenant.id} />
                            <input type="hidden" name="userId" value={user.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={user.status === "active" ? "suspended" : "active"}
                            />
                            <button
                              type="submit"
                              className={`btn btn-xs ${
                                user.status === "active" ? "btn-warning" : "btn-success"
                              }`}
                            >
                              {user.status === "active" ? "Suspend" : "Activate"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {!tenantUsers.length && (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-500 py-4">
                          No tenant users yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <form action={createTenantUserAction} className="space-y-3">
                <input type="hidden" name="tenantId" value={tenant.id} />
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className="input input-bordered input-sm"
                    placeholder="ops@tenant.com"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    className="input input-bordered input-sm"
                    placeholder="minimum 8 characters"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Role</span>
                  </label>
                  <select name="role" defaultValue="OPERATOR" className="select select-bordered select-sm">
                    <option value="OPERATOR">Operator</option>
                    <option value="ANALYST">Analyst</option>
                    <option value="READ_ONLY">Read Only</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-sm btn-primary w-full">
                  Add User
                </button>
                <p className="text-xs text-slate-500">
                  Passwords are hashed immediately; share credentials securely with the operator.
                </p>
              </form>

              <form action={resetTenantUserPasswordAction} className="space-y-3">
                <input type="hidden" name="tenantId" value={tenant.id} />
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">User ID</span>
                  </label>
                  <select name="userId" className="select select-bordered select-sm" required>
                    <option value="">Select tenant user</option>
                    {tenantUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    className="input input-bordered input-sm"
                    placeholder="minimum 8 characters"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-outline w-full">
                  Reset Password
                </button>
              </form>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md rounded-xl">
            <div className="card-body space-y-1 text-sm">
              <h2 className="card-title text-sm font-semibold text-slate-700">
                Summary
              </h2>
              <p>Games: {tenant.games}</p>
              <p>Sessions: {tenant.sessions}</p>
              <p>
                Revenue: ${Number(tenant.revenue).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-slate-500">
                Created at:{" "}
                {tenant.createdAt
                  ? new Date(tenant.createdAt).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md rounded-xl">
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-sm font-semibold text-slate-700">
                    Game Assignments
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure RTP profile per game
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-compact text-xs">
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Type</th>
                      <th>RTP</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameAssignments.map((assignment) => (
                      <tr key={assignment.gameId}>
                        <td className="font-semibold">{assignment.name}</td>
                        <td>{assignment.type || "-"}</td>
                        <td>{assignment.rtpProfile}</td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              assignment.isActive ? "badge-success" : "badge-error"
                            }`}
                          >
                            {assignment.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td>
                          <form action={updateGameAssignment} className="flex flex-wrap gap-2 items-center">
                            <input type="hidden" name="tenantId" value={tenant.id} />
                            <input type="hidden" name="gameId" value={assignment.gameId} />
                            <select name="rtpProfile" defaultValue={assignment.rtpProfile} className="select select-bordered select-xs">
                              <option value="HIGH">High (97%)</option>
                              <option value="MEDIUM">Medium (95%)</option>
                              <option value="LOW">Low (90%)</option>
                            </select>
                            <select
                              name="isActive"
                              defaultValue={assignment.isActive ? "true" : "false"}
                              className="select select-bordered select-xs"
                            >
                              <option value="true">Active</option>
                              <option value="false">Disabled</option>
                            </select>
                            <button type="submit" className="btn btn-xs btn-outline">
                              Save
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {gameAssignments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-500 py-4">
                          No games assigned to this tenant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
