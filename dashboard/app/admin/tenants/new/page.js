import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminTenant } from "../../../../src/lib/api";

async function createTenantAction(formData) {
  "use server";

  const name = formData.get("name")?.toString().trim();
  const domain = formData.get("domain")?.toString().trim() || "";
  const contactEmail = formData.get("contactEmail")?.toString().trim() || "";
  const status = formData.get("status")?.toString().trim() || "active";

  if (!name) {
    throw new Error("Tenant name is required");
  }

  const result = await createAdminTenant({
    name,
    domain: domain || null,
    contactEmail: contactEmail || null,
    status,
  });

  revalidatePath("/admin/tenants");
  const tenantId = result?.tenant?.id;
  const secret = result?.credentials?.clientSecret;
  if (tenantId) {
    const query = secret ? `?rotatedSecret=${encodeURIComponent(secret)}` : "";
    redirect(`/admin/tenants/${tenantId}${query}`);
  }
  redirect("/admin/tenants");
}

export default function CreateTenantPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Tenant Operations
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Create Tenant</h1>
        <p className="text-sm text-slate-600">
          Configure credentials and metadata for a new tenant account.
        </p>
      </div>

      <div className="card space-y-6">
        <form action={createTenantAction} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                Tenant Name<span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                required
                className="input"
                placeholder="Acme Gaming Pvt Ltd"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                Domain
              </label>
              <input
                name="domain"
                className="input"
                placeholder="play.acme.games"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                className="input"
                placeholder="ops@acme.games"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">
                Status
              </label>
              <select name="status" className="select">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/admin/tenants" className="btn btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary">
              Create Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
