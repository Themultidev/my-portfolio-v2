"use client";
import { useRef, useState, type ReactNode } from "react";
import type { ProjectRecord } from "../../lib/project-types";
import EditableText from "../editor/EditableText";
import EditableElement from "../editor/EditableElement";
import { countries, nigeriaStates } from "../../lib/countries";
import { useEditMode } from "../editor/EditModeProvider";
import {
  projectRequest,
  uploadProjectPhoto,
  useProjectBoard,
} from "./ProjectBoardContext";

export function ProjectCopy({
  projectId,
  sourceId,
  blockKey,
  field,
  children,
}: {
  projectId: number;
  sourceId: number;
  blockKey: string;
  field: "title" | "description" | "copy";
  children: ReactNode;
}) {
  const board = useProjectBoard();
  const editor = useEditMode();
  if (projectId === sourceId)
    return (
      <EditableText
        blockKey={blockKey}
        saveValue={
          field === "copy"
            ? undefined
            : async (value) => {
                if (!editor)
                  return { ok: false, error: "Sign in to edit this project." };
                const result = await editor.saveBlock(blockKey, value);
                if (result.ok)
                  board?.setRecords((records) =>
                    records.map((record) =>
                      record.id === projectId
                        ? { ...record, [field]: result.value }
                        : record,
                    ),
                  );
                return result;
              }
        }
      >
        {children}
      </EditableText>
    );
  if (field === "copy") return <>{children}</>;
  return (
    <EditableText
      blockKey={`project.${projectId}.${field}`}
      controlledValue={String(children ?? "")}
      saveValue={async (value) => {
        const previous = board?.records.find(({ id }) => id === projectId);
        board?.setRecords((records) =>
          records.map((record) =>
            record.id === projectId ? { ...record, [field]: value } : record,
          ),
        );
        try {
          const body = await projectRequest(
            `/api/projects/${projectId}`,
            "PATCH",
            { [field]: value },
          );
          board?.setRecords((records) =>
            records.map((record) =>
              record.id === projectId
                ? { ...record, [field]: body.project[field] }
                : record,
            ),
          );
          return { ok: true, value: body.project[field] ?? "" };
        } catch (error) {
          if (previous)
            board?.setRecords((records) =>
              records.map((record) =>
                record.id === projectId
                  ? { ...record, [field]: previous[field] }
                  : record,
              ),
            );
          return {
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to save. Try again.",
          };
        }
      }}
    >
      {children}
    </EditableText>
  );
}

export function ProjectImage({
  project,
  sourceId,
  blockKey,
  elementProps,
}: {
  project: ProjectRecord;
  sourceId: number;
  blockKey: string;
  elementProps: Record<string, unknown>;
}) {
  const editor = useEditMode(),
    board = useProjectBoard(),
    input = useRef<HTMLInputElement>(null),
    busyRef = useRef(false);
  const [error, setError] = useState(""),
    [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const key = `project.${project.id}.photo`;
  const imageProps = { ...elementProps, src: project.photoUrl ?? undefined };
  function choosePhoto() {
    if (editor?.activateBlock(key)) {
      editor.deactivateBlock(key);
      input.current?.click();
    }
  }
  async function save(url: string) {
    const previous = project.photoUrl;
    board?.setRecords((records) =>
      records.map((record) =>
        record.id === project.id ? { ...record, photoUrl: url } : record,
      ),
    );
    try {
      await projectRequest(`/api/projects/${project.id}`, "PATCH", {
        photoUrl: url,
      });
      editor?.setDirty(key, false);
      editor?.deactivateBlock(key);
      setPendingUrl(null);
      setError("");
    } catch (error) {
      board?.setRecords((records) =>
        records.map((record) =>
          record.id === project.id ? { ...record, photoUrl: previous } : record,
        ),
      );
      setPendingUrl(url);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to replace photo. Try again.",
      );
    }
  }
  async function upload(file?: File) {
    if (!file || busyRef.current || !editor?.activateBlock(key)) return;
    busyRef.current = true;
    editor.setDirty(key, true);
    setError("");
    try {
      await save(await uploadProjectPhoto(file));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to upload photo.",
      );
    } finally {
      busyRef.current = false;
    }
  }
  if (!editor?.editable)
    return !project.photoUrl ? null : project.id === sourceId ? (
      <EditableElement
        tag="img"
        blockKeys={{ alt: blockKey }}
        elementProps={imageProps}
      />
    ) : (
      <img {...imageProps} alt={project.title} />
    );
  return (
    <>
      {project.photoUrl ? (
        <img
          {...imageProps}
          alt={
            (project.id === sourceId
              ? editor.blocks[blockKey]?.value
              : project.title) ?? String(elementProps.alt ?? project.title)
          }
          role="button"
          tabIndex={0}
          title="Replace photo"
          data-project-photo={project.id}
          onClick={choosePhoto}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              choosePhoto();
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="min-h-40 border-2 border-dashed border-cyan-400 text-cyan-400"
          onClick={choosePhoto}
        >
          Add photo
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        aria-label={`Replace photo for ${project.title}`}
        className="sr-only"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {project.id === sourceId && (
        <div
          className="absolute right-1 top-1 max-w-32 truncate bg-black text-xs text-cyan-400"
          title="Edit image description"
        >
          <EditableText blockKey={blockKey}>
            {String(elementProps.alt ?? "")}
          </EditableText>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="absolute top-0 z-20 rounded border border-cyan-400 bg-black p-3 text-red-300"
        >
          {error}
          <button
            type="button"
            onClick={async () => {
              if (busyRef.current) return;
              if (pendingUrl) {
                busyRef.current = true;
                try {
                  await save(pendingUrl);
                } finally {
                  busyRef.current = false;
                }
              } else input.current?.click();
            }}
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setPendingUrl(null);
              editor.setDirty(key, false);
              editor.deactivateBlock(key);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}

export function ProjectActions({ project }: { project: ProjectRecord }) {
  const editor = useEditMode(),
    board = useProjectBoard();
  const key = `project.${project.id}.details`;
  const [opened, setOpened] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState({
    link: project.link ?? "",
    repoUrl: project.repoUrl ?? "",
    order: project.order,
    published: project.published,
    countryCode: project.countryCode ?? "",
    regionCode: project.regionCode ?? "",
  });
  function close() {
    if (busy) return;
    setOpened(false);
    setError("");
    editor?.setDirty(key, false);
    editor?.deactivateBlock(key);
  }
  async function save(remove = false) {
    if (busy || !board || !editor?.activateBlock(key)) return;
    if (remove && !window.confirm(`Delete “${project.title}”?`)) {
      editor.deactivateBlock(key);
      return;
    }
    setBusy(true);
    setError("");
    editor.setDirty(key, true);
    try {
      const body = await projectRequest(
        `/api/projects/${project.id}`,
        remove ? "DELETE" : "PATCH",
        remove
          ? undefined
          : {
              ...draft,
              link: draft.link || null,
              repoUrl: draft.repoUrl || null,
              countryCode: draft.countryCode || null,
              regionCode: draft.regionCode || null,
            },
      );
      board.setRecords((records) =>
        remove
          ? records.filter(({ id }) => id !== project.id)
          : records
              .map((record) =>
                record.id === project.id
                  ? {
                      ...record,
                      link: body.project.link,
                      repoUrl: body.project.repoUrl,
                      order: body.project.order,
                      published: body.project.published,
                      countryCode: body.project.countryCode,
                      regionCode: body.project.regionCode,
                    }
                  : record,
              )
              .sort((a, b) => a.order - b.order || a.id - b.id),
      );
      setOpened(false);
      editor.setDirty(key, false);
      editor.deactivateBlock(key);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (project.id < 0) return null;
  return (
    <div
      data-project-actions={project.id}
      className="absolute bottom-1 right-1 z-10 text-xs text-cyan-400"
    >
      {!opened ? (
        <button
          type="button"
          className="rounded border bg-black px-2 py-1"
          onClick={() => {
            if (editor?.activateBlock(key)) {
              setDraft({
                link: project.link ?? "",
                repoUrl: project.repoUrl ?? "",
                order: project.order,
                published: project.published,
                countryCode: project.countryCode ?? "",
                regionCode: project.regionCode ?? "",
              });
              setOpened(true);
            }
          }}
        >
          Project options
        </button>
      ) : (
        <div
          className="grid gap-2 rounded border border-cyan-400 bg-black p-3 text-white"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <label className="block">
            Client country
            <select
              aria-label="Client country"
              disabled={busy}
              value={draft.countryCode}
              className="mt-1 w-full rounded border border-gray-600 bg-black p-2 text-white"
              onChange={(event) => {
                setDraft({
                  ...draft,
                  countryCode: event.target.value,
                  regionCode: "",
                });
                editor?.setDirty(key, true);
              }}
            >
              <option value="">No country assigned</option>
              {countries.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          {draft.countryCode === "NG" && (
            <label className="block">
              Nigerian state
              <select
                aria-label="Nigerian state"
                disabled={busy}
                value={draft.regionCode}
                className="mt-1 w-full rounded border border-gray-600 bg-black p-2 text-white"
                onChange={(event) => {
                  setDraft({ ...draft, regionCode: event.target.value });
                  editor?.setDirty(key, true);
                }}
              >
                <option value="">All Nigeria / state not assigned</option>
                {nigeriaStates.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(["link", "repoUrl"] as const).map((field) => (
            <label key={field}>
              {field === "link" ? "Project URL" : "Repository URL"}
              <input
                aria-label={field === "link" ? "Project URL" : "Repository URL"}
                disabled={busy}
                value={draft[field]}
                className="block w-full border bg-black p-1"
                onChange={(event) => {
                  setDraft({ ...draft, [field]: event.target.value });
                  editor?.setDirty(key, true);
                }}
              />
            </label>
          ))}
          <label>
            Display order
            <input
              aria-label="Display order"
              type="number"
              min={0}
              disabled={busy}
              value={draft.order}
              className="block w-full border bg-black p-1"
              onChange={(event) => {
                setDraft({ ...draft, order: Number(event.target.value) });
                editor?.setDirty(key, true);
              }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              disabled={busy}
              checked={draft.published}
              onChange={(event) => {
                setDraft({ ...draft, published: event.target.checked });
                editor?.setDirty(key, true);
              }}
            />{" "}
            Published
          </label>
          {error && (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" disabled={busy} onClick={() => void save()}>
              Save options
            </button>
            <button type="button" disabled={busy} onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(true)}
            >
              Delete project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
