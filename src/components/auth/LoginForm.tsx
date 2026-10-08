"use client";

import { useState, type FormEvent } from "react";

const fallbackError = "Unable to sign in. Please try again.";

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    const fields = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fields.get("email"),
          password: fields.get("password"),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(
          typeof payload?.error?.message === "string"
            ? payload.error.message
            : fallbackError,
        );
        setIsSubmitting(false);
        return;
      }

      // Auth and portfolio routes use different root layouts.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin/projects");
    } catch {
      setError(fallbackError);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="admin-email" className="mb-2 block">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={isSubmitting}
          className="w-full rounded-lg border border-cyan-400 bg-black px-3 py-2 text-white focus:outline-2 focus:outline-cyan-400 disabled:opacity-50"
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-2 block">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          className="w-full rounded-lg border border-cyan-400 bg-black px-3 py-2 text-white focus:outline-2 focus:outline-cyan-400 disabled:opacity-50"
        />
      </div>
      <p role="status" aria-live="polite" className="min-h-6 text-sm">
        {error}
      </p>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full cursor-pointer rounded-lg border border-cyan-400 px-4 py-2 font-bold text-cyan-400 hover:bg-cyan-400 hover:text-black disabled:cursor-wait disabled:opacity-50"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
