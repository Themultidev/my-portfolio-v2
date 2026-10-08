"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (response.ok || response.status === 401) {
        // Auth and portfolio routes use different root layouts.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
        return;
      }
    } catch {
      // Keep the user on the current page so they can retry signing out.
    }

    setError("Unable to sign out. Please try again.");
    setIsSubmitting(false);
  }

  return (
    <div className="fixed right-4 top-4 z-50 text-right">
      <button
        type="button"
        onClick={logout}
        disabled={isSubmitting}
        className="cursor-pointer rounded-lg border border-cyan-400 bg-black px-4 py-2 text-cyan-400 hover:bg-cyan-400 hover:text-black disabled:cursor-wait disabled:opacity-50"
      >
        {isSubmitting ? "Signing out…" : "Sign out"}
      </button>
      <p role="status" aria-live="polite" className="mt-2 text-sm text-white">
        {error}
      </p>
    </div>
  );
}
