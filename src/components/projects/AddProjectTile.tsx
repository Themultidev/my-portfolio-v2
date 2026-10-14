"use client";
import { useRef, useState } from "react";
import type {
  ProjectRecord,
  ProjectStackRecord,
} from "../../lib/project-types";
import { useEditMode } from "../editor/EditModeProvider";
import {
  projectRequest,
  uploadProjectPhoto,
  useProjectBoard,
} from "./ProjectBoardContext";
import ProjectStackPicker from "./ProjectStackPicker";

export default function AddProjectTile() {
  const editor = useEditMode(),
    board = useProjectBoard();
  const key = "project.new",
    fileInput = useRef<HTMLInputElement>(null),
    busyRef = useRef(false);
  const [opened, setOpened] = useState(false),
    [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(""),
    [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [stacks, setStacks] = useState<ProjectStackRecord[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function reset() {
    setTitle("");
    setPhotoUrl(null);
    setStacks([]);
    setErrors({});
    setOpened(false);
    editor?.setDirty(key, false);
    editor?.deactivateBlock(key);
  }
  async function upload(file?: File) {
    if (!file || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    editor?.setDirty(key, true);
    try {
      setPhotoUrl(await uploadProjectPhoto(file));
      setErrors((errors) => ({ ...errors, photoUrl: "" }));
    } catch (error) {
      setErrors((errors) => ({
        ...errors,
        photoUrl:
          error instanceof Error ? error.message : "Unable to upload photo.",
      }));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function save() {
    if (busyRef.current || !board) return;
    if (!title.trim()) {
      setErrors({ title: "Add a title." });
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setErrors({});
    editor?.setDirty(key, true);
    const temporaryId = -Date.now();
    const optimistic: ProjectRecord = {
      id: temporaryId,
      title,
      photoUrl,
      description: null,
      link: null,
      repoUrl: null,
      published: true,
      order: Math.max(-1, ...board.records.map(({ order }) => order)) + 1,
      stacks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    board.setRecords((records) => [...records, optimistic]);
    try {
      const body = await projectRequest("/api/projects", "POST", {
        title,
        photoUrl,
        stackIds: stacks.map(({ id }) => id),
      });
      board.setRecords((records) =>
        records.map((record) =>
          record.id === temporaryId ? body.project : record,
        ),
      );
      reset();
    } catch (error) {
      board.setRecords((records) =>
        records.filter(({ id }) => id !== temporaryId),
      );
      const fields = (error as { fields?: Record<string, string[]> }).fields;
      setErrors(
        fields && Object.keys(fields).length
          ? Object.fromEntries(
              Object.entries(fields).map(([key, value]) => [
                key,
                value.join(" "),
              ]),
            )
          : {
              save:
                error instanceof Error
                  ? error.message
                  : "Unable to create project. Try again.",
            },
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <div
      data-add-project-tile=""
      className="relative grid gap-6 text-center rounded grid-col-1 border-1 md:text-left lg:translate-y-30"
      style={{ minHeight: 300 }}
    >
      {!opened ? (
        <div className="flex items-center justify-center">
          <button
            type="button"
            aria-label="Add project"
            className="flex items-center justify-center rounded-full border-2 border-dashed border-cyan-400 text-4xl text-cyan-400 transition hover:scale-105 hover:opacity-80"
            style={{ width: "clamp(64px, 44%, 96px)", aspectRatio: "1" }}
            onClick={() => {
              if (editor?.activateBlock(key)) setOpened(true);
            }}
          >
            +
          </button>
        </div>
      ) : (
        <div
          data-add-project-panel=""
          className="grid gap-5 pb-4"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !busy) {
              event.preventDefault();
              reset();
            }
          }}
        >
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void upload(event.dataTransfer.files[0]);
            }}
          >
            <button
              type="button"
              disabled={busy}
              aria-label="Add photo"
              className={`block w-full overflow-hidden ${photoUrl ? "" : "border-2 border-dashed border-cyan-400"}`}
              onClick={() => fileInput.current?.click()}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="New project preview"
                  className="w-full h-auto md:h-[100%] object-cover"
                />
              ) : (
                <span className="flex min-h-40 items-center justify-center">
                  Add photo — click or drop image
                </span>
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              aria-label="Upload project photo"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                void upload(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {errors.photoUrl && (
              <p role="alert" className="text-red-300">
                {errors.photoUrl}
              </p>
            )}
          </div>
          <div className="px-3">
            <input
              autoFocus
              aria-label="Add title"
              placeholder="Add title"
              disabled={busy}
              value={title}
              maxLength={10000}
              className="w-full bg-transparent text-[20px] text-cyan-400 outline-dashed outline-2 outline-cyan-400"
              onChange={(event) => {
                setTitle(event.target.value);
                setErrors((errors) => ({ ...errors, title: "" }));
                editor?.setDirty(key, true);
              }}
            />
            {errors.title && (
              <p role="alert" className="text-red-300">
                {errors.title}
              </p>
            )}
          </div>
          <div className="px-3">
            <p className="text-cyan-400">Add stack</p>
            <ul className="mt-5 flex gap-4 items-center justify-center border-gray-400 border-t-2 relative *:relative *:-top-4 *:bg-gray-900 *:rounded-full *:w-8 *:h-8">
              <ProjectStackPicker
                projectId={0}
                title="new project"
                stacks={stacks}
                onChange={(next) => {
                  setStacks(next);
                  editor?.setDirty(key, true);
                }}
              />
            </ul>
            {errors.stackIds && (
              <p role="alert" className="text-red-300">
                {errors.stackIds}
              </p>
            )}
          </div>
          {errors.save && (
            <p role="alert" className="text-red-300">
              {errors.save}
            </p>
          )}
          <div className="flex gap-3 px-3 text-cyan-400">
            <button
              type="button"
              disabled={busy}
              className="rounded border px-3 py-2"
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save project"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded border px-3 py-2"
              onClick={reset}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
