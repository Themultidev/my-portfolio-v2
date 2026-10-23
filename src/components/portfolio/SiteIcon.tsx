import type { SVGProps } from "react";
export type SiteIconName =
  | "arrow-up-right"
  | "arrow-right"
  | "arrow-left"
  | "arrow-down"
  | "arrow-up"
  | "star"
  | "sun"
  | "moon"
  | "github"
  | "x"
  | "linkedin"
  | "home"
  | "about"
  | "projects"
  | "contact"
  | "resume"
  | "blog"
  | "play"
  | "pause"
  | "heart";
export default function SiteIcon({
  name,
  className = "",
  ...props
}: { name: SiteIconName } & SVGProps<SVGSVGElement>) {
  const shapes = {
    "arrow-up-right": <path d="M6 18 18 6M6 6h12v12" />,
    "arrow-right": <path d="M4 12h16m-7-7 7 7-7 7" />,
    "arrow-left": <path d="M20 12H4m7-7-7 7 7 7" />,
    "arrow-down": <path d="M12 4v16m-7-7 7 7 7-7" />,
    "arrow-up": <path d="M12 20V4m-7 7 7-7 7 7" />,
    star: <path d="M12 1v22M1 12h22M4.2 4.2l15.6 15.6M4.2 19.8 19.8 4.2" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" />,
    github: (
      <path
        fill="currentColor"
        stroke="none"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.58 9.58 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.58 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    ),
    x: <path d="m4 3 12 18h4L8 3H4Zm0 18 7-8m2-2 7-8" />,
    linkedin: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7.5 10v7m4-7v7m0-4a3 3 0 0 1 6 0v4" />
        <circle cx="7.5" cy="7" r=".75" fill="currentColor" stroke="none" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3V10Z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    about: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    projects: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V3h8v4M3 12a22 22 0 0 0 18 0M12 11v4" />
      </>
    ),
    contact: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    resume: (
      <>
        <path d="M14 3H5v18h14V8l-5-5Z" />
        <path d="M14 3v5h5M8 12h8m-8 4h6" />
      </>
    ),
    blog: (
      <path d="M12 5C8 2 4 3 2 4v16c3-2 6-2 10 0 4-2 7-2 10 0V4c-3-1-6-2-10 1Zm0 0v15" />
    ),
    play: <path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="4" />,
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
  };
  return (
    <svg
      className={`site-icon ${className}`}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {shapes[name]}
    </svg>
  );
}
