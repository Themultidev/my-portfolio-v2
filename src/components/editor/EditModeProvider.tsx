"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ContentRecord = Record<string, { value: string; label: string }>;
export type SaveResult =
  { ok: true; value: string } | { ok: false; error: string };

export interface EditModeContextValue {
  blocks: ContentRecord;
  editable: boolean;
  hasUnsavedChanges: boolean;
  activeBlock: string | null;
  setDirty: (key: string, dirty: boolean) => void;
  activateBlock: (key: string) => boolean;
  deactivateBlock: (key: string) => void;
  saveBlock: (key: string, value: string) => Promise<SaveResult>;
  confirmLeave: () => boolean;
  isLeaving: () => boolean;
}

const EditModeContext = createContext<EditModeContextValue | null>(null);

export function useEditMode() {
  return useContext(EditModeContext);
}

function saveError(status: number, body: unknown) {
  if (status === 401)
    return "Your session has ended. Copy your changes before signing in again.";
  if (status === 404)
    return "This content is no longer available. Copy your changes before reloading.";

  if (typeof body === "object" && body !== null && "error" in body) {
    const error = body.error;
    if (typeof error === "object" && error !== null) {
      if (
        "fields" in error &&
        typeof error.fields === "object" &&
        error.fields
      ) {
        const fields = error.fields as Record<string, unknown>;
        const first = Array.isArray(fields.value) ? fields.value[0] : undefined;
        if (typeof first === "string") return first.slice(0, 250);
      }
      if ("message" in error && typeof error.message === "string")
        return error.message.slice(0, 250);
    }
  }
  return "Unable to save. Your changes are still here; please try again.";
}

export default function EditModeProvider({
  children,
  blocks: initialBlocks,
  editable,
}: {
  children: ReactNode;
  blocks: ContentRecord;
  editable: boolean;
}) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(() => new Set());
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const blocksRef = useRef(blocks);
  const dirtyRef = useRef(new Set<string>());
  const activeRef = useRef<string | null>(null);
  const approvedLeaveRef = useRef(false);
  const pendingRef = useRef(new Map<string, Promise<SaveResult>>());

  const setDirty = useCallback((key: string, dirty: boolean) => {
    const next = new Set(dirtyRef.current);
    if (dirty) {
      next.add(key);
      approvedLeaveRef.current = false;
    } else next.delete(key);
    dirtyRef.current = next;
    setDirtyKeys(next);
  }, []);

  const activateBlock = useCallback(
    (key: string) => {
      if (!editable) return false;
      if (activeRef.current && activeRef.current !== key) {
        setStatus(
          "Save or cancel your current edit before editing another field.",
        );
        return false;
      }
      activeRef.current = key;
      approvedLeaveRef.current = false;
      setActiveBlock(key);
      setStatus("");
      return true;
    },
    [editable],
  );

  const deactivateBlock = useCallback((key: string) => {
    if (activeRef.current !== key) return;
    activeRef.current = null;
    setActiveBlock(null);
  }, []);

  const confirmLeave = useCallback(() => {
    if (!dirtyRef.current.size) return true;
    const approved = window.confirm(
      pendingRef.current.size
        ? "Changes are still saving and may finish after you leave. Leave this page?"
        : "You have unsaved changes. Leave this page and discard unsaved drafts? Saves already sent may still finish.",
    );
    approvedLeaveRef.current = approved;
    if (approved) {
      activeRef.current = null;
      setActiveBlock(null);
      dirtyRef.current = new Set();
      setDirtyKeys(new Set());
    }
    return approved;
  }, []);

  const isLeaving = useCallback(() => approvedLeaveRef.current, []);

  const saveBlock = useCallback(
    (key: string, value: string): Promise<SaveResult> => {
      const pending = pendingRef.current.get(key);
      if (pending) return pending;
      if (approvedLeaveRef.current)
        return Promise.resolve({
          ok: false,
          error: "This edit was discarded.",
        });
      if (!editable)
        return Promise.resolve({
          ok: false,
          error: "Sign in to edit this content.",
        });

      const previous = blocksRef.current[key];
      setDirty(key, true);
      const optimistic = {
        ...blocksRef.current,
        [key]: { label: previous?.label ?? key, value },
      };
      blocksRef.current = optimistic;
      setBlocks(optimistic);
      setStatus("Saving…");

      const request = (async (): Promise<SaveResult> => {
        try {
          const response = await fetch(
            `/api/blocks/${encodeURIComponent(key)}`,
            {
              method: "PATCH",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ value }),
            },
          );
          const body: unknown = await response.json().catch(() => null);
          if (!response.ok) throw new Error(saveError(response.status, body));
          const saved =
            typeof body === "object" && body !== null && "block" in body
              ? body.block
              : null;
          if (
            typeof saved !== "object" ||
            saved === null ||
            !("value" in saved) ||
            typeof saved.value !== "string"
          )
            throw new Error("Unable to confirm the save. Please try again.");

          const next = {
            ...blocksRef.current,
            [key]: {
              value: saved.value,
              label:
                "label" in saved && typeof saved.label === "string"
                  ? saved.label
                  : (previous?.label ?? key),
            },
          };
          blocksRef.current = next;
          setBlocks(next);
          setDirty(key, false);
          setStatus("Saved.");
          return { ok: true, value: saved.value };
        } catch (error) {
          const next = { ...blocksRef.current };
          if (previous) next[key] = previous;
          else delete next[key];
          blocksRef.current = next;
          setBlocks(next);
          const message =
            error instanceof Error && !(error instanceof TypeError)
              ? error.message
              : "Unable to save. Your changes are still here; please try again.";
          setStatus("Save failed. Your changes are still in the editor.");
          return { ok: false, error: message };
        } finally {
          pendingRef.current.delete(key);
        }
      })();
      pendingRef.current.set(key, request);
      return request;
    },
    [editable, setDirty],
  );

  useEffect(() => {
    if (!editable) return;
    let protectedUrl = window.location.href;
    let protectedState: unknown = window.history.state;
    let blockedPointerAnchor: HTMLAnchorElement | null = null;

    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current.size || approvedLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }

    function beforeLeave(event: Event) {
      if (!confirmLeave()) event.preventDefault();
    }

    function interacted() {
      approvedLeaveRef.current = false;
    }

    function leavingAnchor(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element) ||
        event.target.closest("[data-content-editor], [data-content-editor-ui]")
      )
        return null;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return null;
      if (anchor.target === "_blank" || anchor.hasAttribute("download"))
        return null;
      const target = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      // Section scrolling keeps the editor and its draft mounted.
      if (
        target.origin === current.origin &&
        target.pathname === current.pathname &&
        target.search === current.search &&
        Boolean(target.hash)
      )
        return null;
      return anchor;
    }

    function pointerdown(event: PointerEvent) {
      interacted();
      blockedPointerAnchor = null;
      if (!dirtyRef.current.size) return;
      const anchor = leavingAnchor(event);
      if (!anchor) return;
      // Pointer focus changes happen before click, and would otherwise save on blur.
      if (!confirmLeave()) {
        blockedPointerAnchor = anchor;
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function click(event: MouseEvent) {
      const anchor = leavingAnchor(event);
      if (!anchor) return;
      if (blockedPointerAnchor === anchor) {
        blockedPointerAnchor = null;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (!dirtyRef.current.size) return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function rememberLocation() {
      protectedUrl = window.location.href;
      protectedState = window.history.state;
    }

    function popstate(event: PopStateEvent) {
      const current = new URL(window.location.href);
      const previous = new URL(protectedUrl);
      const samePage =
        current.origin === previous.origin &&
        current.pathname === previous.pathname &&
        current.search === previous.search;
      if (!samePage && dirtyRef.current.size && !confirmLeave()) {
        // Restore the mounted page before Next.js handles the history event.
        event.stopImmediatePropagation();
        window.history.pushState(protectedState, "", protectedUrl);
        return;
      }
      rememberLocation();
    }

    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("portfolio:before-leave", beforeLeave);
    window.addEventListener("popstate", popstate, true);
    window.addEventListener("hashchange", rememberLocation);
    document.addEventListener("click", click, true);
    document.addEventListener("pointerdown", pointerdown, true);
    document.addEventListener("keydown", interacted, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("portfolio:before-leave", beforeLeave);
      window.removeEventListener("popstate", popstate, true);
      window.removeEventListener("hashchange", rememberLocation);
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointerdown", pointerdown, true);
      document.removeEventListener("keydown", interacted, true);
    };
  }, [editable, confirmLeave]);

  const context = useMemo(
    () => ({
      blocks,
      editable,
      hasUnsavedChanges: dirtyKeys.size > 0,
      activeBlock,
      setDirty,
      activateBlock,
      deactivateBlock,
      saveBlock,
      confirmLeave,
      isLeaving,
    }),
    [
      blocks,
      editable,
      dirtyKeys,
      activeBlock,
      setDirty,
      activateBlock,
      deactivateBlock,
      saveBlock,
      confirmLeave,
      isLeaving,
    ],
  );

  return (
    <EditModeContext.Provider value={context}>
      {children}
      {editable && (
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-content-editor-ui=""
          className="fixed bottom-20 left-4 z-[100] max-w-[calc(100vw-2rem)] rounded-lg border border-cyan-400 bg-black px-3 py-2 text-sm text-white empty:hidden"
        >
          {status}
        </p>
      )}
    </EditModeContext.Provider>
  );
}
