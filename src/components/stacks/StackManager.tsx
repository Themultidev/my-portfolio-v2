"use client";

import { useState } from "react";
import type { StackRecord } from "../../lib/stack-types";
import { useEditMode } from "../editor/EditModeProvider";
import { uploadPortfolioFile } from "../../lib/upload-client";

type Icon = { name: string; svgPath: string };
const button =
  "cursor-pointer rounded border border-cyan-400 px-3 py-2 text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50";
const field =
  "w-full rounded border border-gray-600 bg-black px-3 py-2 text-white focus:border-cyan-400 focus:outline-none";

async function request(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      body?.error?.message ??
        "Unable to save. Your changes are still here; try again.",
    );
  return body;
}

function IconSelector({
  name,
  value,
  disabled,
  icons,
  onChange,
  onUploading,
}: {
  name: string;
  value: string;
  disabled: boolean;
  icons: Icon[];
  onChange: (value: string) => void;
  onUploading: (busy: boolean, success?: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an icon of at most 5 MiB.");
      return;
    }
    setUploading(true);
    onUploading(true);
    setError("");
    let success = false;
    try {
      onChange(await uploadPortfolioFile(file, "stack"));
      success = true;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
      onUploading(false, success);
    }
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <img
          src={value}
          alt={`${name || "New stack"} icon preview`}
          className="h-8 w-8 shrink-0 object-contain"
        />
        <label className="grow">
          Bundled icon
          <select
            aria-label={`Bundled icon for ${name || "new stack"}`}
            className={field}
            value={value}
            disabled={disabled || uploading}
            onChange={(event) => {
              setError("");
              onChange(event.target.value);
            }}
          >
            {!icons.some((icon) => icon.svgPath === value) && (
              <option value={value}>Uploaded icon</option>
            )}
            {icons.map((icon) => (
              <option key={icon.svgPath} value={icon.svgPath}>
                {icon.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm text-gray-300">
        {uploading ? "Uploading…" : "Upload / replace icon"}
        <input
          aria-label={`Upload icon for ${name || "new stack"}`}
          type="file"
          accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.avif"
          disabled={disabled || uploading}
          className="mt-1 block w-full text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void upload(file);
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function StackForm({
  stack,
  icons,
  saved,
  removed,
}: {
  stack?: StackRecord;
  icons: Icon[];
  saved: (stack: StackRecord) => void;
  removed?: (id: number) => void;
}) {
  const originalIcon = stack?.svgPath ?? icons[0].svgPath;
  const [name, setName] = useState(stack?.name ?? "");
  const [icon, setIcon] = useState(originalIcon);
  const [order, setOrder] = useState(stack ? String(stack.order) : "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const editor = useEditMode();
  const dirtyKey = stack ? `stack.${stack.id}` : "stack.new";
  function dirty(nextName: string, nextIcon: string, nextOrder: string) {
    editor?.setDirty(
      dirtyKey,
      nextName !== (stack?.name ?? "") ||
        nextIcon !== originalIcon ||
        nextOrder !== (stack ? String(stack.order) : ""),
    );
    setError("");
    setStatus("");
  }
  function cancel() {
    setName(stack?.name ?? "");
    setIcon(originalIcon);
    setOrder(stack ? String(stack.order) : "");
    editor?.setDirty(dirtyKey, false);
    setError("");
    setStatus("");
  }
  async function save() {
    if (busy || uploading) return;
    if (!name.trim()) {
      setError("Enter a stack name.");
      return;
    }
    if (
      order !== "" &&
      (!/^\d+$/.test(order) || Number(order) > 2_147_483_647)
    ) {
      setError("Order must be a non-negative whole number.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const body = await request(
        stack ? `/api/stacks/${stack.id}` : "/api/stacks",
        {
          method: stack ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            svgPath: icon,
            ...(order === "" ? {} : { order: Number(order) }),
          }),
        },
      );
      if (!body?.stack || typeof body.stack.id !== "number")
        throw new Error("Unable to confirm the save. Try again.");
      saved(body.stack);
      editor?.setDirty(dirtyKey, false);
      if (!stack) {
        setName("");
        setIcon(icons[0].svgPath);
        setOrder("");
      } else {
        setName(body.stack.name);
        setIcon(body.stack.svgPath);
        setOrder(String(body.stack.order));
      }
      setStatus(stack ? "Saved." : "Stack added.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Save failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!stack || !window.confirm(`Delete ${stack.name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await request(`/api/stacks/${stack.id}`, { method: "DELETE" });
      editor?.setDirty(dirtyKey, false);
      removed?.(stack.id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Delete failed. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      data-stack-id={stack?.id ?? "new"}
      className="space-y-3 rounded-lg border border-gray-700 bg-gray-900 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy && !uploading) {
          event.preventDefault();
          cancel();
        }
      }}
    >
      <label className="block">
        {stack ? "Stack name" : "New stack name"}
        <input
          aria-label={stack ? `Name for ${stack.name}` : "New stack name"}
          className={field}
          value={name}
          maxLength={100}
          disabled={busy || uploading}
          required
          onChange={(event) => {
            setName(event.target.value);
            dirty(event.target.value, icon, order);
          }}
        />
      </label>
      <IconSelector
        name={stack?.name ?? ""}
        value={icon}
        icons={icons}
        disabled={busy}
        onChange={(value) => {
          setIcon(value);
          dirty(name, value, order);
        }}
        onUploading={(active, success) => {
          setUploading(active);
          if (active) editor?.setDirty(dirtyKey, true);
          else if (!success) dirty(name, icon, order);
        }}
      />
      <label className="block text-sm">
        Catalog order
        <input
          aria-label={stack ? `Order for ${stack.name}` : "New stack order"}
          className={field}
          type="number"
          min={0}
          max={2_147_483_647}
          value={order}
          disabled={busy || uploading}
          placeholder={stack ? undefined : "After the last stack"}
          onChange={(event) => {
            setOrder(event.target.value);
            dirty(name, icon, event.target.value);
          }}
        />
      </label>
      {stack && (
        <p className="text-sm text-gray-300">
          {stack.projectCount
            ? `Used by ${stack.projectCount} project(s). Remove it from those projects before deleting.`
            : "Not used by a project."}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={button} disabled={busy || uploading}>
          {uploading
            ? "Uploading…"
            : busy
              ? "Saving…"
              : stack
                ? "Save changes"
                : "Add stack"}
        </button>
        <button
          type="button"
          className={button}
          disabled={busy || uploading}
          onClick={cancel}
        >
          Cancel
        </button>
        {stack && (
          <button
            type="button"
            className={button}
            disabled={busy || uploading || stack.projectCount > 0}
            onClick={() => void remove()}
          >
            Delete
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="text-sm text-cyan-400">
        {status}
      </p>
    </form>
  );
}

export default function StackManager({
  initialStacks,
  icons,
}: {
  initialStacks: StackRecord[];
  icons: Icon[];
}) {
  const [stacks, setStacks] = useState(initialStacks);
  function saved(stack: StackRecord) {
    setStacks((current) =>
      [...current.filter(({ id }) => id !== stack.id), stack].sort(
        (a, b) => a.order - b.order || a.id - b.id,
      ),
    );
  }
  return (
    <main className="mx-auto max-w-6xl px-6 py-24 pb-40 text-white">
      <h1 className="mb-4 text-3xl font-bold text-cyan-400">Manage stacks</h1>
      <p className="mb-8 text-gray-300">
        Add a technology name, attach an SVG using Upload / replace icon (or
        choose a bundled icon), and save it to the catalog. Its name appears in
        the project editor&apos;s Add stack picker; selecting it displays its
        icon. Replace an icon here to update project cards that use that stack.
      </p>
      <section
        aria-labelledby="new-stack-heading"
        className="mb-10 max-w-xl rounded-2xl border-2 border-dashed border-cyan-400 bg-gray-900 p-6"
      >
        <h2 id="new-stack-heading" className="mb-3 text-xl text-cyan-400">
          <span
            aria-hidden="true"
            className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400"
          >
            +
          </span>{" "}
          Add a stack
        </h2>
        <p className="mb-3 text-sm text-gray-300">
          Give it a name and attach an SVG or choose a bundled icon. Save once,
          then select that name in any project. Uploads support up to 5 MB.
        </p>
        <StackForm icons={icons} saved={saved} />
      </section>
      <section aria-labelledby="stack-catalog-heading">
        <h2 id="stack-catalog-heading" className="mb-4 text-xl text-cyan-400">
          Stack catalog ({stacks.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stacks.map((stack) => (
            <StackForm
              key={stack.id}
              stack={stack}
              icons={icons}
              saved={saved}
              removed={(id) =>
                setStacks((current) => current.filter((item) => item.id !== id))
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}
