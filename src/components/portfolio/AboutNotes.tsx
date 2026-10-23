"use client";
import { useState } from "react";
import { useEditMode } from "../editor/EditModeProvider";
import EditableText from "../editor/EditableText";
export default function AboutNotes() {
  const editor = useEditMode();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const notes = Object.entries(editor?.blocks ?? {}).filter(([key]) =>
    key.startsWith("about.note."),
  );
  async function save(key?: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(key ? `/api/notes/${key}` : "/api/notes", {
        method: key ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: key ? undefined : JSON.stringify({ value: draft }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error?.message ?? "Unable to save note.");
      editor?.setDirty("about-note-draft", false);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save note.");
      setBusy(false);
    }
  }
  return (
    <div className="about-notes">
      {notes.map(([key, block]) => (
        <div key={key} className="about-note">
          <span className="status-dot" />
          <p>
            <EditableText blockKey={key} multiline>
              {block.value}
            </EditableText>
          </p>
          {editor?.editable && (
            <button
              type="button"
              disabled={busy}
              aria-label="Delete note"
              onClick={() => {
                if (confirm("Delete this note?")) void save(key);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      {editor?.editable && (
        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label htmlFor="about-note">Add a thought or learning update</label>
          <input
            id="about-note"
            maxLength={2000}
            value={draft}
            placeholder="Currently learning Go…"
            onChange={(e) => {
              setDraft(e.target.value);
              editor.setDirty("about-note-draft", !!e.target.value);
            }}
          />
          <button className="accent-button" disabled={busy || !draft.trim()}>
            + Add text
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
