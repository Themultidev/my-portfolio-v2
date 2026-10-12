"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CONTENT_MAX_LENGTH } from "../../lib/content-validation";
import { useEditMode } from "./EditModeProvider";

export default function EditableElement({
  tag,
  blockKeys,
  elementProps,
  children,
}: {
  tag: "img" | "input" | "textarea";
  blockKeys: Record<string, string>;
  elementProps: Record<string, unknown>;
  children?: ReactNode;
}) {
  const editor = useEditMode();
  const elementRef = useRef<HTMLElement | null>(null);
  const attachElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const attribute = Object.keys(blockKeys)[0];
  const key = blockKeys[attribute];
  const label = editor?.blocks[key]?.label ?? attribute;
  const original =
    typeof elementProps[attribute] === "string"
      ? (elementProps[attribute] as string)
      : "";
  const value = editor?.blocks[key]?.value ?? original;
  const active = Boolean(editor?.editable && editor.activeBlock === key);

  useEffect(() => {
    if (!active) return;
    function reposition() {
      const rectangle = elementRef.current?.getBoundingClientRect();
      if (!rectangle) return;
      const width = Math.min(360, window.innerWidth - 32);
      setPosition({
        position: "fixed",
        left: Math.max(
          16,
          Math.min(rectangle.left, window.innerWidth - width - 16),
        ),
        top: Math.max(
          16,
          Math.min(rectangle.bottom + 8, window.innerHeight - 220),
        ),
        width,
        zIndex: 1001,
      });
    }
    reposition();
    inputRef.current?.focus();
    inputRef.current?.select();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [active]);

  function open() {
    if (!editor?.activateBlock(key)) return;
    setDraft(value);
    setError("");
    editor.setDirty(key, false);
  }

  function cancel() {
    if (!editor || saving) return;
    editor.setDirty(key, false);
    editor.deactivateBlock(key);
    setError("");
  }

  async function save() {
    if (!editor || saving || editor.isLeaving()) return;
    if (draft === value && !error) {
      cancel();
      return;
    }
    setSaving(true);
    setError("");
    const result = await editor.saveBlock(key, draft);
    setSaving(false);
    if (result.ok) editor.deactivateBlock(key);
    else setError(result.error);
  }

  const properties: Record<string, unknown> = { ...elementProps };
  for (const [name, blockKey] of Object.entries(blockKeys))
    properties[name] = editor?.blocks[blockKey]?.value ?? elementProps[name];
  if (editor?.editable) {
    properties["data-content-editor"] = "attribute";
    properties["data-editable-attribute"] = attribute;
    properties["data-block-key"] = key;
    properties.title = `Edit ${label}`;
    properties.style = {
      ...(typeof elementProps.style === "object" ? elementProps.style : {}),
      cursor: "pointer",
      outline: active ? "2px dashed rgb(34 211 238)" : undefined,
      outlineOffset: "2px",
    };
    properties.onMouseEnter = (event: { currentTarget: HTMLElement }) => {
      if (!active)
        event.currentTarget.style.outline = "1px dashed rgb(34 211 238)";
    };
    properties.onMouseLeave = (event: { currentTarget: HTMLElement }) => {
      if (!active) event.currentTarget.style.outline = "";
    };
    properties.onClick = (event: {
      preventDefault(): void;
      stopPropagation(): void;
    }) => {
      event.preventDefault();
      event.stopPropagation();
      open();
    };
    properties.onKeyDown = (event: {
      key: string;
      preventDefault(): void;
      stopPropagation(): void;
    }) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      open();
    };
    if (tag === "img") {
      properties.role = "button";
      properties.tabIndex = 0;
      properties["aria-label"] = `Edit ${label}`;
    }
  }

  const reference = editor?.editable ? attachElement : undefined;
  const element =
    tag === "img" ? (
      <img
        {...properties}
        alt={typeof properties.alt === "string" ? properties.alt : ""}
        ref={reference}
      />
    ) : tag === "input" ? (
      <input {...properties} ref={reference} />
    ) : (
      <textarea {...properties} ref={reference}>
        {children}
      </textarea>
    );
  if (!active || !editor) return element;
  const multiline =
    (tag === "textarea" && attribute === "placeholder") || draft.includes("\n");
  const fieldProps = {
    ref: (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      inputRef.current = element;
    },
    value: draft,
    maxLength: CONTENT_MAX_LENGTH,
    disabled: saving,
    "aria-label": `Edit ${label}`,
    "data-editing-input": key,
    className:
      "w-full rounded border-2 border-dashed border-cyan-400 bg-black p-2 text-white outline-none",
    onChange: (event: { target: { value: string } }) => {
      setDraft(event.target.value);
      editor.setDirty(key, event.target.value !== value);
    },
    onBlur: (event: { relatedTarget: EventTarget | null }) => {
      if (
        event.relatedTarget instanceof Node &&
        panelRef.current?.contains(event.relatedTarget)
      )
        return;
      if (!error) void save();
    },
    onKeyDown: (event: {
      key: string;
      ctrlKey: boolean;
      metaKey: boolean;
      preventDefault(): void;
    }) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void save();
      }
    },
  };
  return (
    <>
      {element}
      {createPortal(
        <div
          ref={panelRef}
          data-content-editor-ui=""
          data-editing-block={key}
          className="rounded-lg border border-cyan-400 bg-black p-3 text-sm text-white shadow-lg"
          style={position}
        >
          <p className="mb-2">{label}</p>
          {multiline ? (
            <textarea {...fieldProps} rows={3} />
          ) : (
            <input {...fieldProps} type="text" />
          )}
          <p role="status" aria-live="polite" className="mt-2">
            {error}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => void save()}
              className="rounded border border-cyan-400 px-3 py-1 text-cyan-400 disabled:opacity-50"
            >
              {saving ? "Saving…" : error ? "Retry" : "Save"}
            </button>
            <button
              type="button"
              disabled={saving}
              onPointerDown={(event) => event.preventDefault()}
              onClick={cancel}
              className="rounded border border-cyan-400 px-3 py-1 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
