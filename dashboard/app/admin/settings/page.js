import { revalidatePath } from "next/cache";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
} from "../../../src/lib/api";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "ANALYST", label: "Analyst" },
  { value: "READ_ONLY", label: "Read Only" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const getFormString = (formData, key) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

async function createAdminAction(formData) {
  "use server";

  const email = getFormString(formData, "email").toLowerCase();
  const password = getFormString(formData, "password");
  const role = getFormString(formData, "role") || "ADMIN";

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  await createAdminUser({ email, password, role });
  revalidatePath("/admin/settings");
}

async function updateAdminAction(formData) {
  "use server";

  const id = getFormString(formData, "id");
  const role = getFormString(formData, "role");
  const status = getFormString(formData, "status");
  const password = getFormString(formData, "password");

  if (!id) {
    throw new Error("Admin user id is required");
  }

  const payload = {};
  if (role) payload.role = role;
  if (status) payload.status = status;
  if (password) payload.password = password;

  if (Object.keys(payload).length === 0) {
    throw new Error("No updates provided");
  }

  await updateAdminUser(id, payload);
  revalidatePath("/admin/settings");
}

function roleLabel(value) {
  return ROLE_OPTIONS.find((role) => role.value === value)?.label || value;
}

export default async function AdminSettingsPage() {
  const response = await getAdminUsers();
  const users = response?.users || [];

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Settings</h1>
        <p className="text-base text-slate-600">
          Manage platform administrators, credentials, and security posture.
        </p>
      </div>

      <section className="card bg-base-100 shadow rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Invite Admin User</h2>
        <form action={createAdminAction} className="grid gap-4 md:grid-cols-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input name="email" type="email" className="input input-bordered" required />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Role</span>
            </label>
            <select name="role" className="select select-bordered">
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Temporary Password</span>
            </label>
            <input name="password" type="text" className="input input-bordered" required />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn btn-primary">
              Create Admin
            </button>
          </div>
        </form>
      </section>

      <section className="card bg-base-100 shadow rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              Access Control
            </p>
            <h2 className="text-xl font-bold text-slate-900">Admin Directory</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table text-sm">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-semibold">{user.email}</td>
                  <td>{roleLabel(user.role)}</td>
                  <td>
                    <span
                      className={`badge ${
                        user.status === "active" ? "badge-success" : "badge-error"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>
                    <details className="dropdown dropdown-end">
                      <summary className="btn btn-xs btn-outline">Manage</summary>
                      <div className="dropdown-content z-[1] bg-base-100 rounded-box p-4 w-72 space-y-3 shadow">
                        <form action={updateAdminAction} className="space-y-2">
                          <input type="hidden" name="id" value={user.id} />
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">
                                Role (current: {roleLabel(user.role)})
                              </span>
                            </label>
                            <select name="role" defaultValue="" className="select select-bordered select-sm">
                              <option value="">Keep current</option>
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">
                                Status (current: {user.status})
                              </span>
                            </label>
                            <select name="status" defaultValue="" className="select select-bordered select-sm">
                              <option value="">Keep current</option>
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Set New Password</span>
                            </label>
                            <input
                              name="password"
                              type="text"
                              className="input input-bordered input-sm"
                              placeholder="Optional"
                            />
                          </div>
                          <button type="submit" className="btn btn-sm btn-primary w-full">
                            Update
                          </button>
                        </form>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 py-8">
                    No admin users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
