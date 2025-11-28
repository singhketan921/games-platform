import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  getAdminTenants,
  updateAdminTenantStatus,
  deleteAdminTenant,
} from "../../../src/lib/api";

async function toggleStatus(formData) {
  "use server";
  const id = formData.get("id")?.toString().trim();
  const nextStatus = formData.get("status")?.toString().trim();

  if (!id) {
    throw new Error("Tenant id is required");
  }

  if (!nextStatus) {
    throw new Error("Tenant status is required");
  }

  await updateAdminTenantStatus(id, nextStatus);
  revalidatePath("/admin/tenants");
}

async function removeTenant(formData) {
  "use server";
  const id = formData.get("id")?.toString().trim();

  if (!id) {
    throw new Error("Tenant id is required");
  }

  await deleteAdminTenant(id);
  revalidatePath("/admin/tenants");
}

const badgeClass = (status) =>
  status === "active" ? "badge badge-success" : "badge badge-error";

export default async function TenantsPage({ searchParams }) {
  const resolved = (await searchParams) ?? {};
  const query = (resolved.q || "").toString().trim().toLowerCase();
  const data = await getAdminTenants();
  const tenants = data.tenants || [];

  const filtered = query
    ? tenants.filter((tenant) =>
        tenant.name.toLowerCase().includes(query) ||
        (tenant.domain || "").toLowerCase().includes(query)
      )
    : tenants;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
            Tenant Operations
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Tenants</h1>
          <p className="text-base text-slate-600">Manage all tenant accounts</p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <input
            type="search"
            name="q"
            placeholder="Search tenants"
            defaultValue={query}
            className="input input-bordered input-sm"
          />
        </form>
      </div>

      <div className="overflow-x-auto bg-base-100 shadow rounded-xl p-4">
        <table className="table table-zebra w-full text-sm">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Games</th>
              <th>Sessions</th>
              <th>Revenue</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tenant) => (
              <tr key={tenant.id}>
                <td className="font-semibold text-slate-900">{tenant.name}</td>
                <td>{tenant.games}</td>
                <td>{tenant.sessions}</td>
                <td>${Number(tenant.revenue).toLocaleString()}</td>
                <td>
                  <span className={badgeClass(tenant.status)}>{tenant.status}</span>
                </td>
                <td>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="btn btn-xs btn-outline"
                    >
                      Edit
                    </Link>
                    <form action={toggleStatus}>
                      <input type="hidden" name="id" value={tenant.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={tenant.status === "active" ? "suspended" : "active"}
                      />
                      <button
                        type="submit"
                        className={`btn btn-xs ${
                          tenant.status === "active" ? "btn-warning" : "btn-success"
                        }`}
                      >
                        {tenant.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </form>
                    <form action={removeTenant}>
                      <input type="hidden" name="id" value={tenant.id} />
                      <button
                        type="submit"
                        className="btn btn-xs btn-outline btn-error"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
