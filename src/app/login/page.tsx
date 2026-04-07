"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, next }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(data.redirect || "/");
      router.refresh();
    } else {
      setError("Incorrect password. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
      <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-sm p-8 w-full max-w-sm">
        <div className="mb-6 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "#EBF9F6" }}
          >
            🔑
          </div>
          <h1 className="text-xl text-[#1A2340]" style={{ fontWeight: 800 }}>
            Knowledge Hub
          </h1>
          <p className="text-sm text-[#6B7299] mt-1">Enter the team password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl border border-[#E8EAF0] text-sm text-[#1A2340] outline-none focus:border-[#3ECFB2] transition-colors"
          />

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm text-white transition-opacity disabled:opacity-60"
            style={{ background: "#3ECFB2", fontWeight: 700 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F6FA]" />}>
      <LoginForm />
    </Suspense>
  );
}
