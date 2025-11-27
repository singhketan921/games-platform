import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getAdminTenants,
  updateAdminTenant,
  updateAdminTenantStatus,
} from "../../../../src/lib/api";

async function saveTenant(formData) {
  "use server";

  const id = formData.get("id");
  const name = formData.get("name")?.toString().trim() || "";
  const domain = formData.get("domain")?.toString().trim() || "";
  const contactEmail = formData.get("contactEmail")?.toString().trim() || "";
  const status = formData.get("status")?.toString().trim() || "active";

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

  const id = formData.get("id");
  const nextStatus = formData.get("status");
  await updateAdminTenantStatus(id, nextStatus);

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
  redirect(`/admin/tenants/${id}`);
}

export default async function TenantEditPage({ params } = {}) {
  const resolvedParams = (await params) ?? {};
  const { id } = resolvedParams;
  const data = await getAdminTenants();
  const tenants = data.tenants || [];
  const tenant = tenants.find((t) => t.id === id);

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
          ← Back to Tenants
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
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
