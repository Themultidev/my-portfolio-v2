"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditMode } from "./EditModeProvider";
type History = { undo: string | null; redo: string | null; version: number };
async function readHistory(): Promise<History> {
  const response = await fetch("/api/history", {
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body?.error?.message ?? "Unable to load undo history.");
  return body;
}
const style =
  "rounded border border-cyan-400 px-2 py-1 text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40";
export default function HistoryControls() {
  const editor = useEditMode();
  const [history, setHistory] = useState<History | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false),
    [confirmation, setConfirmation] = useState("");
  const busyRef = useRef(false);
  const refresh = useCallback(async () => {
    try {
      const body = await readHistory();
      setHistory(body);
      setError("");
      return body as History;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load undo history.",
      );
      return null;
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    void readHistory()
      .then((value) => {
        if (mounted) setHistory(value);
      })
      .catch((error) => {
        if (mounted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load undo history.",
          );
      });
    const update = () => {
      void refresh();
    };
    window.addEventListener("portfolio:saved", update);
    window.addEventListener("focus", update);
    return () => {
      mounted = false;
      window.removeEventListener("portfolio:saved", update);
      window.removeEventListener("focus", update);
    };
  }, [refresh]);
  const perform = useCallback(
    async (action: "undo" | "redo" | "defaults") => {
      if (busyRef.current || editor?.hasUnsavedChanges || editor?.activeBlock)
        return;
      busyRef.current = true;
      setBusy(true);
      setError("");
      try {
        const current = await refresh();
        if (!current) return;
        if (action !== "defaults" && !current[action]) return;
        const response = await fetch("/api/history", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "defaults"
              ? { action, confirmation }
              : { action, version: current.version },
          ),
          signal: AbortSignal.timeout(45_000),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body?.error?.message ?? "Unable to restore changes.");
        window.location.reload();
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to restore changes.",
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [editor, confirmation, refresh],
  );
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.repeat ||
        event.defaultPrevented ||
        resetOpen
      )
        return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      if (editor?.hasUnsavedChanges || editor?.activeBlock) return;
      event.preventDefault();
      void perform(key === "y" || event.shiftKey ? "redo" : "undo");
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [editor, perform, resetOpen]);
  const blocked = busy || !!editor?.hasUnsavedChanges || !!editor?.activeBlock;
  return (
    <>
      <button
        type="button"
        className={style}
        disabled={blocked || !history?.undo}
        title={
          history?.undo
            ? `Undo: ${history.undo} (Ctrl/Cmd+Z)`
            : "Nothing to undo"
        }
        onClick={() => void perform("undo")}
      >
        Undo
      </button>
      <button
        type="button"
        className={style}
        disabled={blocked || !history?.redo}
        title={
          history?.redo
            ? `Redo: ${history.redo} (Ctrl/Cmd+Shift+Z)`
            : "Nothing to redo"
        }
        onClick={() => void perform("redo")}
      >
        Redo
      </button>
      <button
        type="button"
        className={style}
        disabled={blocked}
        onClick={() => {
          setResetOpen(true);
          setConfirmation("");
        }}
      >
        Restore defaults
      </button>
      {error && (
        <span role="alert" className="max-w-xs text-red-300">
          {error}{" "}
          <button type="button" onClick={() => void refresh()}>
            Retry history
          </button>
        </span>
      )}
      {resetOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4"
          data-content-editor-ui=""
          onKeyDown={(event) => {
            if (event.key === "Escape" && !busy) setResetOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-default-title"
            className="w-full max-w-lg space-y-4 rounded-xl border border-cyan-400 bg-gray-950 p-6 text-white shadow-xl"
          >
            <h2
              id="restore-default-title"
              className="text-xl font-bold text-cyan-400"
            >
              Restore the original portfolio?
            </h2>
            <p>
              This replaces all current portfolio text, projects, stack icons,
              résumé links and social links with the original defaults. Added
              projects and stacks will be removed. Your admin account stays the
              same.
            </p>
            <p>
              You can Undo this reset afterward. The latest 50 saved changes are
              kept.
            </p>
            <label className="block">
              Type <strong>RESTORE ORIGINAL PORTFOLIO</strong> to confirm
              <input
                autoFocus
                value={confirmation}
                disabled={busy}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-2 w-full rounded border border-gray-600 bg-black p-2"
                aria-label="Restore confirmation"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                className={style}
                disabled={busy || confirmation !== "RESTORE ORIGINAL PORTFOLIO"}
                onClick={() => void perform("defaults")}
              >
                {busy ? "Restoring…" : "Restore original portfolio"}
              </button>
              <button
                type="button"
                className={style}
                disabled={busy}
                onClick={() => setResetOpen(false)}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
