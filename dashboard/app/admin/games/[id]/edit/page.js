import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminGame, updateAdminGame } from "../../../../../src/lib/api";

async function saveGame(formData) {
  "use server";

  const id = formData.get("id")?.toString();
  if (!id) {
    throw new Error("Game id is required");
  }

  const payload = {
    name: formData.get("name")?.toString().trim(),
    status: formData.get("status")?.toString().trim(),
    description: formData.get("description")?.toString().trim(),
    volatility: formData.get("volatility")?.toString().trim(),
    rtp: formData.get("rtp")?.toString().trim(),
  };

  await updateAdminGame(id, payload);
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export default async function EditGamePage({ params }) {
  const { id } = params;
  const data = await getAdminGame(id);
  const game = data?.game;

  if (!game) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Game not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Game Management</p>
          <h1 className="text-3xl font-bold text-slate-900">Edit Game</h1>
          <p className="text-sm text-slate-600">Game ID: {game.id}</p>
        </div>
        <a href="/admin/games" className="btn btn-ghost btn-sm">
          Back to Games
        </a>
      </div>

      <form action={saveGame} className="card bg-base-100 shadow rounded-xl p-6 space-y-6">
        <input type="hidden" name="id" value={game.id} />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Name</label>
            <input name="name" defaultValue={game.name} className="input input-bordered" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Status</label>
            <select name="status" defaultValue={game.status} className="select select-bordered">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Description</label>
          <textarea
            name="description"
            defaultValue={game.description || ""}
            className="textarea textarea-bordered"
            rows={4}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Volatility</label>
            <select
              name="volatility"
              defaultValue={game.volatility || "Medium"}
              className="select select-bordered"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">RTP (%)</label>
            <input
              type="number"
              step="0.1"
              name="rtp"
              defaultValue={game.rtp}
              className="input input-bordered"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <a href="/admin/games" className="btn btn-ghost">
            Cancel
          </a>
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
