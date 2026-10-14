"use client";
import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ProjectStackRecord } from "../../lib/project-types";
import type { StackRecord } from "../../lib/stack-types";
import { useEditMode } from "../editor/EditModeProvider";
import { projectRequest, useProjectBoard } from "./ProjectBoardContext";
import StackChip from "./StackChip";

export default function ProjectStackPicker({
  projectId,
  title,
  stacks,
  profile = 1,
  onChange,
}: {
  projectId: number;
  title: string;
  stacks: ProjectStackRecord[];
  profile?: number;
  children?: ReactNode;
  onChange?: (stacks: ProjectStackRecord[]) => void;
}) {
  const editor = useEditMode(),
    board = useProjectBoard();
  const key = `project.${projectId}.stacks`;
  const trigger = useRef<HTMLButtonElement>(null),
    busyRef = useRef(false);
  const [catalog, setCatalog] = useState<StackRecord[]>([]);
  const [optimistic, setOptimistic] = useState<ProjectStackRecord[] | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  const [position, setPosition] = useState({ top: 16, left: 16 });
  const current = optimistic ?? stacks;
  async function load() {
    if (!onChange && !editor?.activateBlock(key)) return;
    const rect = trigger.current?.getBoundingClientRect();
    setPosition({
      top: Math.max(16, Math.min(rect?.bottom ?? 16, window.innerHeight - 420)),
      left: Math.max(16, Math.min(rect?.left ?? 16, window.innerWidth - 376)),
    });
    setOpened(true);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stacks", {
        credentials: "same-origin",
        signal: AbortSignal.timeout(30_000),
      });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.stacks))
        throw new Error(body?.error?.message ?? "Unable to load stacks.");
      setCatalog(body.stacks);
      setLoaded(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load stacks.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit(next: ProjectStackRecord[]) {
    if (busyRef.current || busy || next.length > 5) return;
    if (onChange) {
      onChange(next);
      return;
    }
    if (!editor?.activateBlock(key)) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setOptimistic(next);
    editor.setDirty(key, true);
    try {
      const body = await projectRequest(`/api/projects/${projectId}`, "PATCH", {
        stackIds: next.map(({ id }) => id),
      });
      setOptimistic(null);
      board?.setRecords((records) =>
        records.map((record) =>
          record.id === projectId
            ? { ...record, stacks: body.project.stacks }
            : record,
        ),
      );
      editor.setDirty(key, false);
      if (!opened) editor.deactivateBlock(key);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save stacks. Try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function close() {
    if (busy || busyRef.current) return;
    setOptimistic(null);
    setError("");
    setOpened(false);
    if (!onChange) {
      editor?.setDirty(key, false);
      editor?.deactivateBlock(key);
    }
    trigger.current?.focus();
  }
  return (
    <>
      {current.map((stack) => (
        <StackChip
          key={stack.id}
          stack={stack}
          profile={profile}
          onRemove={() =>
            void commit(current.filter(({ id }) => id !== stack.id))
          }
        />
      ))}
      <li className="flex items-center justify-center border-2 border-dashed border-cyan-400">
        <button
          ref={trigger}
          type="button"
          data-project-stacks={projectId}
          aria-label={`Add stack to ${title}`}
          title="Add stack"
          className="h-full w-full cursor-pointer text-cyan-400"
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => void load()}
        >
          +
        </button>
      </li>
      {!opened && error && (
        <li role="alert" className="!h-auto !w-auto text-red-300">
          {error}{" "}
          <button type="button" onClick={() => void commit(current)}>
            Retry
          </button>
          <button type="button" onClick={close}>
            Cancel
          </button>
        </li>
      )}
      {opened &&
        createPortal(
          <div
            role="dialog"
            aria-label={`Choose stacks for ${title}`}
            data-content-editor-ui=""
            data-stack-picker={projectId}
            className="fixed z-[1100] rounded-lg border border-cyan-400 bg-black p-4 text-sm text-white shadow-lg"
            style={{
              ...position,
              width: "min(360px, calc(100vw - 32px))",
              maxHeight: `calc(100vh - ${position.top + 16}px)`,
              overflowY: "auto",
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                close();
              }
            }}
          >
            <h2 className="mb-3 font-bold text-cyan-400">Choose stacks</h2>
            <a
              href="/admin/stacks"
              className="mb-3 block text-cyan-400 underline"
            >
              Manage stack names and SVG icons
            </a>
            <input
              autoFocus
              aria-label="Search stacks"
              className="mb-3 w-full rounded border border-gray-600 bg-black px-2 py-2 text-white"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {catalog
                .filter(({ name }) =>
                  name.toLowerCase().includes(search.trim().toLowerCase()),
                )
                .map((stack) => (
                  <label key={stack.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={current.some(({ id }) => id === stack.id)}
                      disabled={
                        busy ||
                        (!current.some(({ id }) => id === stack.id) &&
                          current.length >= 5)
                      }
                      onChange={(event) =>
                        void commit(
                          event.target.checked
                            ? [...current, { ...stack, order: current.length }]
                            : current.filter(({ id }) => id !== stack.id),
                        )
                      }
                    />
                    {stack.name}
                  </label>
                ))}
            </div>
            <p className="my-3 text-gray-300">
              {current.length}/5 selected.{" "}
              {current.length >= 5
                ? "Max 5 stacks"
                : "Select a name to add its icon immediately."}
            </p>
            {error && (
              <p role="alert" className="mb-3 text-red-300">
                {error}
              </p>
            )}
            {error && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void (loaded ? commit(current) : load())}
              >
                Retry
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              className="cursor-pointer rounded border border-cyan-400 px-3 py-2 text-cyan-400 disabled:opacity-50"
              onClick={close}
            >
              {busy ? "Saving…" : error ? "Cancel" : "Done"}
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
