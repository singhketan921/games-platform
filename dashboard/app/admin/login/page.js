"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setAlert({ type: "error", message: "Please enter email and password." });
      return;
    }

    setAlert({ type: "success", message: "Demo only: login successful." });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md p-8">
        <h1 className="card-title text-2xl font-semibold text-slate-900">Admin Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input input-bordered w-full"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input input-bordered w-full"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4">
            Sign In
          </button>
        </form>

        {alert && (
          <div
            role="alert"
            className={`alert mt-4 rounded-xl ${
              alert.type === "error" ? "alert-error" : "alert-success"
            }`}
          >
            {alert.message}
          </div>
        )}

        <div className="mt-4 text-center">
          <a href="/admin" className="link link-primary">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
