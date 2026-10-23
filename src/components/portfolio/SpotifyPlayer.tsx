"use client";
import { useEffect, useRef, useState } from "react";
type Playback = { data: { isPaused: boolean; isBuffering: boolean } };
type Controller = {
  play: () => void;
  pause: () => void;
  destroy: () => void;
  addListener: (event: string, callback: (event: Playback) => void) => void;
};
type SpotifyApi = {
  createController: (
    node: HTMLElement,
    options: { url: string; width: string; height: number },
    callback: (controller: Controller) => void,
  ) => void;
};
let apiPromise: Promise<SpotifyApi> | undefined;
function loadApi() {
  if (!apiPromise)
    apiPromise = new Promise<SpotifyApi>((resolve, reject) => {
      const host = window as typeof window & {
        onSpotifyIframeApiReady?: (api: SpotifyApi) => void;
      };
      host.onSpotifyIframeApiReady = resolve;
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      script.onerror = () => {
        apiPromise = undefined;
        reject(new Error("Spotify is unavailable."));
      };
      document.head.append(script);
    });
  return apiPromise;
}
export default function SpotifyPlayer({
  source,
  autoplay,
  onPlayback,
}: {
  source: string;
  autoplay: boolean;
  onPlayback: (playing: boolean) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onPlayback);
  const [error, setError] = useState("");
  useEffect(() => {
    callback.current = onPlayback;
  }, [onPlayback]);
  useEffect(() => {
    let disposed = false;
    let controller: Controller | undefined;
    const target = container.current;
    const mount = document.createElement("div");
    target?.append(mount);
    const start = () => {
      try {
        controller?.play();
      } catch {}
    };
    void loadApi()
      .then((api) => {
        if (disposed) return;
        api.createController(
          mount,
          { url: source, width: "100%", height: 152 },
          (value) => {
            if (disposed) {
              value.destroy();
              return;
            }
            controller = value;
            value.addListener("ready", () => {
              if (autoplay) start();
            });
            value.addListener("playback_update", (event) =>
              callback.current(!event.data.isPaused && !event.data.isBuffering),
            );
          },
        );
      })
      .catch(() => {
        if (!disposed)
          setError(
            "Spotify could not load. Open the track in Spotify instead.",
          );
      });
    if (autoplay) {
      document.addEventListener("pointerdown", start, { once: true });
      document.addEventListener("keydown", start, { once: true });
    }
    return () => {
      disposed = true;
      document.removeEventListener("pointerdown", start);
      document.removeEventListener("keydown", start);
      controller?.destroy();
      mount.remove();
    };
  }, [source, autoplay]);
  return (
    <>
      <div ref={container} />
      {error && (
        <p role="status" className="help-text">
          {error}{" "}
          <a href={source} target="_blank" rel="noreferrer">
            Open Spotify ↗
          </a>
        </p>
      )}
    </>
  );
}
