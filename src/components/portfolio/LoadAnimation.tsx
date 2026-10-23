"use client";
import { useEffect, useState } from "react";
export default function LoadAnimation() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      timer = setTimeout(() => setDone(true), 180);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    const fallback = setTimeout(() => setDone(true), 3500);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
      window.removeEventListener("load", finish);
    };
  }, []);
  if (done) return null;
  return (
    <div
      className="load-animation"
      role="status"
      aria-label="Loading portfolio"
    >
      <div className="load-scene">
        <div className="walking-person">
          <svg viewBox="0 0 120 145" aria-hidden="true">
            <defs>
              <linearGradient id="umbrella-gloss" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#ffb176" />
                <stop offset=".45" stopColor="#ff6600" />
                <stop offset="1" stopColor="#bd3900" />
              </linearGradient>
            </defs>
            <path
              d="M16 48Q56 -17 106 48Q94 37 82 48Q69 37 57 48Q44 37 32 48Q23 40 16 48"
              fill="url(#umbrella-gloss)"
            />
            <path
              d="M58 14V88Q58 98 65 94"
              stroke="#5f6165"
              strokeWidth="3"
              fill="none"
            />
            <circle cx="48" cy="64" r="9" fill="#a86b46" />
            <path d="M38 75L55 75L61 107L34 107Z" fill="#171719" />
            <path d="M44 75L48 91L52 75" fill="#fff" />
            <path
              d="M42 80L31 96L37 102M54 80L65 89L61 93"
              stroke="#171719"
              strokeWidth="7"
              fill="none"
            />
            <g className="leg-one">
              <path d="M42 103L37 130" stroke="#171719" strokeWidth="8" />
              <path d="M34 127L42 132L29 136L27 132Z" fill="#050505" />
            </g>
            <g className="leg-two">
              <path d="M52 103L61 130" stroke="#171719" strokeWidth="8" />
              <path d="M58 128L64 128L71 135L58 135Z" fill="#050505" />
            </g>
          </svg>
        </div>
        <div className="load-track">
          <span />
        </div>
        <p>
          Making things happen<span className="accent">.</span>
        </p>
      </div>
    </div>
  );
}
