"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { siteLinkKeys, type SiteLinkKind } from "../../lib/site-links";
import { useEditMode } from "./EditModeProvider";
import { uploadPortfolioFile } from "../../lib/upload-client";

export default function EditableSiteLink({
  kind,
  elementProps,
  children,
}: {
  kind: SiteLinkKind;
  elementProps: Record<string, unknown>;
  children: ReactNode;
}) {
  const editor = useEditMode();
  const key = siteLinkKeys[kind],
    resume = kind === "resume";
  const label = resume ? "résumé" : kind === "x" ? "X" : "LinkedIn";
  const value = editor?.blocks[key]?.value ?? String(elementProps.href ?? "");
  const attached =
    resume && /^\/uploads\/resumes\/[a-f0-9-]{36}\.pdf$/.test(value);
  const anchor = useRef<HTMLAnchorElement>(null),
    field = useRef<HTMLInputElement>(null),
    file = useRef<HTMLInputElement>(null),
    busyRef = useRef(false);
  const [opened, setOpened] = useState(false),
    [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(""),
    [pending, setPending] = useState<string | null>(null),
    [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 80, left: 16 });
  const active = opened && editor?.activeBlock === key;
  const labelKey = `desktopNavigation.text.${resume ? "006" : kind === "x" ? "007" : "008"}`;
  const [labelDraft, setLabelDraft] = useState("");
  useEffect(() => {
    if (!active) return;
    function place() {
      const rect = anchor.current?.getBoundingClientRect();
      setPosition({
        top: Math.max(
          16,
          Math.min((rect?.bottom ?? 64) + 12, window.innerHeight - 360),
        ),
        left: Math.max(16, Math.min(rect?.left ?? 16, window.innerWidth - 396)),
      });
    }
    place();
    field.current?.focus();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [active]);
  function open() {
    if (!editor?.activateBlock(key)) return;
    setOpened(true);
    setDraft(value);
    setLabelDraft(editor.blocks[labelKey]?.value ?? "");
    setPending(null);
    setError("");
  }
  function close() {
    if (busyRef.current) return;
    editor?.setDirty(key, false);
    editor?.setDirty(labelKey, false);
    editor?.deactivateBlock(key);
    setOpened(false);
    setError("");
    setPending(null);
    anchor.current?.focus();
  }
  async function save(next: string) {
    if (!editor) return;
    if (!(await saveLabel())) return;
    const result = await editor.saveBlock(key, next);
    if (result.ok) {
      editor.deactivateBlock(key);
      setOpened(false);
      setPending(null);
    } else setError(result.error);
  }
  async function saveLabel() {
    if (
      !editor ||
      !editor.blocks[labelKey] ||
      labelDraft === editor.blocks[labelKey].value
    )
      return true;
    const result = await editor.saveBlock(labelKey, labelDraft);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    editor.setDirty(labelKey, false);
    return true;
  }
  async function commitLabel() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await saveLabel();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function commit(next = pending ?? draft) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await save(next);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function upload(selected?: File) {
    if (!selected || busyRef.current || !editor) return;
    if (
      selected.size > 5 * 1024 * 1024 ||
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Choose a PDF résumé no larger than 5 MB.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    editor.setDirty(key, true);
    try {
      const url = await uploadPortfolioFile(selected, "resume");
      setPending(url);
      await save(url);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to upload résumé. Try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const linkProps = { ...elementProps, href: value || undefined };
  if (!editor?.editable)
    return (
      <a
        {...linkProps}
        {...(resume && value === ""
          ? { "aria-disabled": true, title: "Résumé unavailable" }
          : {})}
      >
        {children}
      </a>
    );
  return (
    <>
      <a
        {...linkProps}
        ref={anchor}
        data-content-editor-ui=""
        data-site-link={kind}
        role="button"
        tabIndex={0}
        aria-label={resume ? "Manage résumé" : `Edit ${label} link`}
        title={resume ? "Upload or manage résumé" : `Edit ${label} URL`}
        onClickCapture={(event) => {
          event.preventDefault();
          event.stopPropagation();
          open();
        }}
        onKeyDownCapture={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            open();
          }
        }}
      >
        {children}
      </a>
      {active &&
        createPortal(
          <section
            role="dialog"
            aria-label={resume ? "Manage résumé" : `Edit ${label} link`}
            data-site-link-editor={kind}
            data-content-editor-ui=""
            className="fixed z-[1100] rounded-2xl border border-cyan-400 bg-gray-900 p-5 text-sm text-white shadow-lg"
            style={{
              ...position,
              width: "min(380px, calc(100vw - 32px))",
              maxHeight: `calc(100vh - ${position.top + 16}px)`,
              overflowY: "auto",
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                close();
              } else if (
                event.key === "Enter" &&
                (event.ctrlKey || event.metaKey) &&
                !resume
              ) {
                event.preventDefault();
                void commit();
              }
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-cyan-400">
                  {resume ? "Your résumé" : `${label} profile`}
                </h2>
                <p className="mt-1 text-gray-300">
                  {resume
                    ? "Upload a PDF for visitors to open."
                    : "Update the destination behind this icon."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close link editor"
                disabled={busy}
                onClick={close}
                className="rounded border border-gray-600 px-2 py-1"
              >
                ×
              </button>
            </div>
            {editor.blocks[labelKey] && (
              <div className="mb-4">
                <label className="block text-xs">
                  Button label
                  <input
                    className="mt-1 w-full rounded border border-gray-600 bg-black px-3 py-2 text-white"
                    maxLength={80}
                    value={labelDraft}
                    disabled={busy}
                    onChange={(event) => {
                      setLabelDraft(event.target.value);
                      editor.setDirty(
                        labelKey,
                        event.target.value !== editor.blocks[labelKey].value,
                      );
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="mt-2 text-xs text-cyan-400 underline"
                  disabled={
                    busy || labelDraft === editor.blocks[labelKey].value
                  }
                  onClick={() => void commitLabel()}
                >
                  Save button label
                </button>
              </div>
            )}
            {resume ? (
              <>
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-gray-600 p-3">
                  <span className="rounded border border-cyan-400 px-2 py-3 font-mono text-cyan-400">
                    PDF
                  </span>
                  <div>
                    <p className="font-semibold">
                      {attached ? "Résumé attached" : "No résumé attached"}
                    </p>
                    {attached ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline"
                      >
                        View current résumé
                      </a>
                    ) : (
                      <p className="text-xs text-gray-300">PDF · up to 5 MB</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  className="w-full rounded-lg border border-cyan-400 bg-cyan-400 px-4 py-3 font-semibold text-black disabled:opacity-50"
                  onClick={() => file.current?.click()}
                >
                  {busy
                    ? "Saving…"
                    : attached
                      ? "Replace résumé"
                      : "Upload résumé"}
                </button>
                <input
                  ref={file}
                  type="file"
                  accept="application/pdf,.pdf"
                  aria-label="Upload résumé PDF"
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    void upload(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {attached && (
                  <button
                    type="button"
                    disabled={busy}
                    className="mt-3 w-full rounded-lg border border-red-300 px-4 py-2 text-red-300 disabled:opacity-50"
                    onClick={() => {
                      if (
                        window.confirm("Remove the résumé from the portfolio?")
                      )
                        void commit("");
                    }}
                  >
                    Remove résumé
                  </button>
                )}
              </>
            ) : (
              <label className="block">
                Profile URL
                <input
                  ref={field}
                  type="url"
                  aria-label={`${label} profile URL`}
                  className="mt-2 w-full rounded-lg border border-gray-600 bg-black px-3 py-3 text-white focus:border-cyan-400 focus:outline-none"
                  value={draft}
                  disabled={busy}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    editor.setDirty(key, event.target.value !== value);
                    setError("");
                  }}
                />
              </label>
            )}
            {error && (
              <p role="alert" className="mt-3 text-red-300">
                {error}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              {(!resume || pending) && (
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-lg border border-cyan-400 px-4 py-2 text-cyan-400 disabled:opacity-50"
                  onClick={() => void commit()}
                >
                  {error ? "Retry" : "Save link"}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-gray-600 px-4 py-2 disabled:opacity-50"
                onClick={close}
              >
                Cancel
              </button>
            </div>
          </section>,
          document.body,
        )}
    </>
  );
}
