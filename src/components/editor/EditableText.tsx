"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CONTENT_MAX_LENGTH } from "../../lib/content-validation";
import { useEditMode, type EditModeContextValue } from "./EditModeProvider";

interface EditableTextProps {
  blockKey: string;
  children: ReactNode;
  multiline?: boolean;
  as?: "pre";
  elementProps?: Record<string, unknown>;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface EditorPosition extends Rect {
  font: CSSProperties;
  background: string;
}

function textRects(element: HTMLElement): Rect[] {
  const range = document.createRange();
  range.selectNodeContents(element);
  const rects = Array.from(range.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map(({ top, left, width, height }) => ({ top, left, width, height }));
  if (rects.length) return rects;
  const { top, left, width, height } = element.getBoundingClientRect();
  return width > 0 && height > 0 ? [{ top, left, width, height }] : [];
}

function editorPosition(element: HTMLElement): EditorPosition {
  const range = document.createRange();
  range.selectNodeContents(element);
  const rect = range.getBoundingClientRect();
  const parent = element.parentElement ?? element;
  const ownRect = element.getBoundingClientRect();
  const fallback =
    ownRect.width && ownRect.height ? ownRect : parent.getBoundingClientRect();
  const source = rect.width ? rect : fallback;
  const computed = window.getComputedStyle(element);
  const transparentText =
    computed.color === "transparent" ||
    /(?:,|\/)\s*0(?:\.0+)?\s*\)$/.test(computed.color);
  let background = "#000";
  let ancestor: HTMLElement | null = element;
  while (ancestor) {
    const color = window.getComputedStyle(ancestor).backgroundColor;
    if (color !== "transparent" && color !== "rgba(0, 0, 0, 0)") {
      background = color;
      break;
    }
    ancestor = ancestor.parentElement;
  }

  const width = Math.min(
    Math.max(source.width + 16, 180),
    window.innerWidth - 24,
  );
  return {
    top: Math.min(
      Math.max(source.top - 4, 8),
      Math.max(8, window.innerHeight - 260),
    ),
    left: Math.max(
      12,
      Math.min(source.left - 8, window.innerWidth - width - 12),
    ),
    width,
    height: Math.max(source.height + 8, 36),
    background,
    font: {
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      textAlign: computed.textAlign as CSSProperties["textAlign"],
      // Gradient text uses a transparent inherited color; keep its edit field visible.
      color: transparentText ? "#06b6d4" : computed.color,
    },
  };
}

export default function EditableText(props: EditableTextProps) {
  const context = useEditMode();
  const value = context?.blocks[props.blockKey]?.value;

  // A public render adds no elements, attributes, listeners, or editor effects.
  if (!context?.editable) {
    // React's native pre renderer protects a direct string's leading line feed.
    if (props.as === "pre")
      return <pre {...props.elementProps}>{value ?? props.children}</pre>;
    return <>{value ?? props.children}</>;
  }
  return <AdminEditableText {...props} context={context} />;
}

function AdminEditableText({
  blockKey,
  children,
  multiline = false,
  as,
  elementProps,
  context,
}: EditableTextProps & { context: EditModeContextValue }) {
  const label = context.blocks[blockKey]?.label ?? blockKey;
  const value = context.blocks[blockKey]?.value;
  const empty = (value ?? children) === "";
  const emptyStyle: CSSProperties = empty
    ? { minWidth: "1ch", minHeight: "1em", outline: "1px dashed #06b6d4" }
    : {};
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [longText, setLongText] = useState(false);
  const [position, setPosition] = useState<EditorPosition | null>(null);
  const [hoverRects, setHoverRects] = useState<Rect[]>([]);
  const elementRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const originalRef = useRef("");
  const busyRef = useRef(false);
  const editing = context.activeBlock === blockKey && position !== null;
  const isMultiline =
    as === "pre" || multiline || longText || draft.includes("\n");

  function open() {
    if (!elementRef.current || !context.activateBlock(blockKey)) return;
    originalRef.current = value ?? elementRef.current.textContent ?? "";
    setLongText(originalRef.current.length > 160);
    setDraft(originalRef.current);
    setError("");
    setPosition(editorPosition(elementRef.current));
    setHoverRects([]);
    context.setDirty(blockKey, false);
  }

  function click(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    const selection = window.getSelection();
    if (
      selection &&
      !selection.isCollapsed &&
      selection.anchorNode &&
      event.currentTarget.contains(selection.anchorNode)
    )
      return;
    if (!editing) open();
  }

  function cancel() {
    if (busyRef.current) return;
    setDraft(originalRef.current);
    setError("");
    context.setDirty(blockKey, false);
    context.deactivateBlock(blockKey);
    elementRef.current?.focus({ preventScroll: true });
  }

  async function save() {
    if (busyRef.current || context.isLeaving()) return;
    if (draft === originalRef.current) {
      context.setDirty(blockKey, false);
      context.deactivateBlock(blockKey);
      return;
    }
    busyRef.current = true;
    setSaving(true);
    setError("");
    const result = await context.saveBlock(blockKey, draft);
    busyRef.current = false;
    setSaving(false);
    if (result.ok) {
      originalRef.current = result.value;
      context.deactivateBlock(blockKey);
    } else {
      setError(result.error);
      fieldRef.current?.focus({ preventScroll: true });
    }
  }

  function keyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.stopPropagation();
      void save();
    }
  }

  useEffect(() => {
    if (!editing) return;
    fieldRef.current?.focus({ preventScroll: true });
    fieldRef.current?.select();
  }, [editing]);

  useEffect(() => {
    if (!editing && !hoverRects.length) return;
    function reposition() {
      if (!elementRef.current) return;
      if (editing) setPosition(editorPosition(elementRef.current));
      else setHoverRects(textRects(elementRef.current));
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [editing, hoverRects.length]);

  const editProps = {
    "data-content-editor": "",
    "data-block-key": blockKey,
    role: "button",
    tabIndex: 0,
    title: `Edit ${label}`,
    "aria-label": `Edit ${label}`,
    onClick: click,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        open();
      }
    },
    onPointerEnter: () => {
      if (elementRef.current && !editing)
        setHoverRects(textRects(elementRef.current));
    },
    onPointerLeave: () => setHoverRects([]),
    onFocus: () => {
      if (elementRef.current && !editing)
        setHoverRects(textRects(elementRef.current));
    },
    onBlur: () => setHoverRects([]),
  };

  const fieldStyle: CSSProperties | undefined = position
    ? {
        ...position.font,
        width: "100%",
        minHeight: position.height,
        maxHeight: "50vh",
        padding: "4px 8px",
        background: position.background,
        border: 0,
        borderRadius: 0,
        outline: "2px dashed #06b6d4",
        outlineOffset: "2px",
        boxSizing: "border-box",
        resize: isMultiline ? "vertical" : "none",
      }
    : undefined;

  return (
    <>
      {as === "pre" ? (
        <pre
          {...elementProps}
          {...editProps}
          ref={(element) => {
            elementRef.current = element;
          }}
          style={{
            ...(typeof elementProps?.style === "object"
              ? elementProps.style
              : {}),
            ...emptyStyle,
            cursor: "text",
          }}
        >
          {value ?? children}
        </pre>
      ) : (
        <span
          {...editProps}
          ref={(element) => {
            elementRef.current = element;
          }}
          style={{
            display: empty ? "inline-block" : "contents",
            ...emptyStyle,
            verticalAlign: "baseline",
            cursor: "text",
          }}
        >
          {value ?? children}
        </span>
      )}
      {!editing &&
        hoverRects.length > 0 &&
        createPortal(
          <div aria-hidden="true" data-content-editor-ui="">
            {hoverRects.map((rect, index) => (
              <div
                key={index}
                style={{
                  position: "fixed",
                  ...rect,
                  pointerEvents: "none",
                  outline: "1px dashed #06b6d4",
                  outlineOffset: "2px",
                  zIndex: 90,
                }}
              />
            ))}
          </div>,
          document.body,
        )}
      {editing &&
        position &&
        createPortal(
          <div
            ref={overlayRef}
            data-content-editor-ui=""
            data-editing-block={blockKey}
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: Math.max(120, window.innerHeight - position.top - 8),
              overflowY: "auto",
              padding: 4,
              zIndex: 100,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {isMultiline ? (
              <textarea
                ref={(element) => {
                  fieldRef.current = element;
                }}
                aria-label={`Edit ${label}`}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `edit-error-${blockKey}` : undefined}
                data-editing-input={blockKey}
                value={draft}
                maxLength={CONTENT_MAX_LENGTH}
                disabled={saving}
                rows={Math.max(2, Math.min(5, draft.split("\n").length))}
                style={fieldStyle}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError("");
                  context.setDirty(
                    blockKey,
                    event.target.value !== originalRef.current,
                  );
                }}
                onKeyDown={keyDown}
                onBlur={(event) => {
                  if (
                    !error &&
                    !overlayRef.current?.contains(event.relatedTarget)
                  )
                    void save();
                }}
              />
            ) : (
              <input
                ref={(element) => {
                  fieldRef.current = element;
                }}
                type="text"
                aria-label={`Edit ${label}`}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `edit-error-${blockKey}` : undefined}
                data-editing-input={blockKey}
                value={draft}
                disabled={saving}
                maxLength={CONTENT_MAX_LENGTH}
                style={fieldStyle}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setError("");
                  context.setDirty(
                    blockKey,
                    event.target.value !== originalRef.current,
                  );
                }}
                onKeyDown={keyDown}
                onBlur={(event) => {
                  if (
                    !error &&
                    !overlayRef.current?.contains(event.relatedTarget)
                  )
                    void save();
                }}
              />
            )}
            <div className="mt-2 rounded border border-cyan-400 bg-black px-2 py-2 text-left text-sm text-white">
              <p className="mb-2 text-xs">
                Blur or Ctrl/Cmd+Enter to save. Escape to cancel.
              </p>
              {error && (
                <p id={`edit-error-${blockKey}`} role="alert" className="mb-2">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  className="cursor-pointer rounded border border-cyan-400 px-3 py-1 text-cyan-400 disabled:cursor-wait disabled:opacity-50"
                  disabled={saving}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => void save()}
                >
                  {saving ? "Saving…" : error ? "Retry" : "Save"}
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded border border-white px-3 py-1 disabled:opacity-50"
                  disabled={saving}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={cancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
