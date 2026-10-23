"use client";
import { useSyncExternalStore } from "react";
function subscribe(callback: () => void) {
  window.addEventListener("themechange", callback);
  return () => window.removeEventListener("themechange", callback);
}
export const themeScript = `(function(){try{var t=localStorage.getItem('portfolio-theme');document.documentElement.dataset.theme=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){}})()`;
export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? "light",
    () => "light",
  );
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("portfolio-theme", next);
    } catch {}
    window.dispatchEvent(new Event("themechange"));
  }
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title="Change theme"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
