"use client";

import { useState } from "react";

export default function CreateGamePage() {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSuccess(true);
  };

  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Game Management</p>
        <h1 className="text-3xl font-bold text-slate-900">Create Game</h1>
      </div>
      <div className="card bg-base-100 shadow-lg rounded-xl border border-slate-100 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Game Details</h2>
          <a href="/admin/games" className="btn btn-ghost btn-sm">
            ← Back to Games
          </a>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label">
              <span className="label-text">Game Name</span>
            </label>
            <input type="text" className="input input-bordered w-full" placeholder="Teen Patti" required />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows="3"
              placeholder="Describe the game"
              required
            ></textarea>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">
                <span className="label-text">RTP (%)</span>
              </label>
              <input type="number" className="input input-bordered w-full" defaultValue={96.4} required />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Volatility</span>
              </label>
              <select className="select select-bordered w-full">
                <option>Low</option>
                <option selected>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">
              <span className="label-text">Initial Status</span>
            </label>
            <select className="select select-bordered w-full">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Create Game
          </button>
        </form>

        {showSuccess && (
          <div role="alert" className="alert alert-success">
            Game created (demo only)
          </div>
        )}
      </div>
    </div>
  );
}
