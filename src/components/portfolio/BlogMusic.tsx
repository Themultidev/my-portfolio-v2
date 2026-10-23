"use client";
import SiteIcon from "./SiteIcon";
import { useEffect, useRef, useState } from "react";
import SpotifyPlayer from "./SpotifyPlayer";
import { spotifyEmbed, type SiteSettings } from "../../lib/site-settings";
export default function BlogMusic({ music }: { music: SiteSettings["music"] }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const paused = useRef(false);
  useEffect(() => {
    if (music.mode !== "audio" || !music.autoplay) return;
    const play = () => {
      if (paused.current) return;
      void audio.current
        ?.play()
        .catch(() => setNotice("Tap play to start the soundtrack."));
    };
    play();
    document.addEventListener("pointerdown", play, { once: true });
    document.addEventListener("keydown", play, { once: true });
    return () => {
      document.removeEventListener("pointerdown", play);
      document.removeEventListener("keydown", play);
    };
  }, [music.mode, music.autoplay, music.source]);
  if (music.mode === "off" || !music.source) return null;
  const embed = spotifyEmbed(music.source);
  return (
    <aside className="music-widget" aria-label="Site soundtrack">
      <div className="music-mini">
        <button
          type="button"
          className={`music-disc ${playing ? "spinning" : ""}`}
          aria-label={
            music.mode === "audio"
              ? playing
                ? "Pause music"
                : "Play music"
              : "Open Spotify player"
          }
          onClick={() => {
            if (music.mode !== "audio") {
              setExpanded(!expanded);
              return;
            }
            if (playing) {
              paused.current = true;
              audio.current?.pause();
            } else {
              paused.current = false;
              void audio.current
                ?.play()
                .catch(() => setNotice("Audio could not start. Try again."));
            }
          }}
        >
          <span className="disc-label">
            <SiteIcon name={playing ? "pause" : "play"} />
          </span>
        </button>
        <div>
          <small>ON THE TURNTABLE</small>
          <p>{music.title || "A little background music"}</p>
        </div>
        <button
          type="button"
          aria-label={
            expanded ? "Collapse music player" : "Expand music player"
          }
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>
      {music.mode === "audio" && (
        <audio
          ref={audio}
          src={music.source}
          autoPlay={music.autoplay}
          loop
          preload="metadata"
          onPlay={() => {
            setPlaying(true);
            setNotice("");
          }}
          onPause={() => setPlaying(false)}
          onError={() => {
            setPlaying(false);
            setNotice("The soundtrack is unavailable.");
          }}
          controls={expanded}
        />
      )}
      {music.mode === "spotify" && embed && (
        <div className={expanded ? "spotify-expanded" : "spotify-collapsed"}>
          <SpotifyPlayer
            source={music.source}
            autoplay={music.autoplay}
            onPlayback={setPlaying}
          />
          <p className="help-text">
            Spotify controls playback. Press Play if it doesn’t start
            automatically.
          </p>
        </div>
      )}
      {music.mode === "jam" && (
        <a
          href={music.source}
          className="accent-button jam-link"
          target="_blank"
          rel="noreferrer"
        >
          Join my Spotify Jam <SiteIcon name="arrow-up-right" />
        </a>
      )}
      {notice && (
        <p className="music-notice" role="status">
          {notice}
        </p>
      )}
    </aside>
  );
}
