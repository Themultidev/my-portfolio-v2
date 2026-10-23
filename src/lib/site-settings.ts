import { z } from "zod";

export const SETTINGS_KEY = "site.settings";
export const skillGroups = ["languages", "databases", "design"] as const;
export const skillLabels = {
  languages: "Languages & frameworks",
  databases: "Databases",
  design: "Style & design",
};
const musicSource = z
  .string()
  .max(500)
  .refine(
    (value) =>
      !value ||
      /^\/uploads\/music\/[a-f0-9-]{36}\.(mp3|wav|ogg|m4a)$/.test(value) ||
      /^https:\/\/(open\.spotify\.com|spotify\.link)\//.test(value),
    "Upload an audio file or enter an official Spotify URL.",
  );
export const settingsSchema = z
  .object({
    githubUsername: z
      .string()
      .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/),
    skills: z
      .array(
        z
          .object({
            id: z.string().min(1).max(80),
            name: z.string().trim().min(1).max(70),
            group: z.enum(skillGroups),
            iconPath: z
              .string()
              .regex(
                /^$|^\/(?:stacks\/[a-z0-9-]+\.svg|uploads\/stacks\/[a-f0-9-]{36}\.png)$/,
              ),
          })
          .strict(),
      )
      .max(100)
      .refine(
        (skills) => new Set(skills.map((s) => s.id)).size === skills.length,
        "Skill IDs must be unique.",
      ),
    music: z
      .object({
        mode: z.enum(["off", "audio", "spotify", "jam"]),
        source: musicSource,
        title: z.string().trim().max(100),
        autoplay: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .superRefine(({ music }, ctx) => {
    if (music.mode === "audio" && !music.source.startsWith("/uploads/music/"))
      ctx.addIssue({
        code: "custom",
        path: ["music", "source"],
        message: "Upload an audio file first.",
      });
    if (
      (music.mode === "spotify" || music.mode === "jam") &&
      !/^https:\/\/(open\.spotify\.com|spotify\.link)\//.test(music.source)
    )
      ctx.addIssue({
        code: "custom",
        path: ["music", "source"],
        message: "Enter an official Spotify URL.",
      });
    if (music.mode === "spotify" && !spotifyEmbed(music.source))
      ctx.addIssue({
        code: "custom",
        path: ["music", "source"],
        message: "Use a Spotify track, album, playlist, episode or show URL.",
      });
  });
export type SiteSettings = z.infer<typeof settingsSchema>;
export function spotifyEmbed(source: string) {
  try {
    const url = new URL(source);
    const match =
      /^\/(?:intl-[a-z]+\/)?(?:embed\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)\/?$/.exec(
        url.pathname,
      );
    return url.hostname === "open.spotify.com" &&
      url.protocol === "https:" &&
      match
      ? `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`
      : null;
  } catch {
    return null;
  }
}
export const defaultSettings: SiteSettings = {
  githubUsername: "Themultidev",
  skills: [
    ["JavaScript", "javascript", "languages"],
    ["TypeScript", "", "languages"],
    ["Node.js", "node-js", "languages"],
    ["Next.js", "next-js", "languages"],
    ["Python", "python", "languages"],
    ["PHP", "php", "languages"],
    ["React", "react", "languages"],
    ["Flutter", "flutter", "languages"],
    ["MySQL", "mysql", "databases"],
    ["MongoDB", "mongodb", "databases"],
    ["HTML", "html", "design"],
    ["CSS", "css", "design"],
    ["Tailwind CSS", "tailwind-css", "design"],
    ["Figma", "figma", "design"],
    ["Sass", "sass", "design"],
    ["Bootstrap", "bootstrap", "design"],
    ["Pen & Paper", "pen-paper", "design"],
    ["Git", "git", "languages"],
    ["GitHub", "github", "languages"],
    ["AI Prompt Engineering", "ai-prompt-engineering", "languages"],
  ].map(([name, icon, group]) => ({
    id: icon || name.toLowerCase(),
    name,
    group: group as (typeof skillGroups)[number],
    iconPath: icon ? `/stacks/${icon}.svg` : "",
  })),
  music: { mode: "off", source: "", title: "On my turntable", autoplay: true },
};
export function parseSettings(value?: string): SiteSettings {
  try {
    return settingsSchema.parse(JSON.parse(value ?? ""));
  } catch {
    return structuredClone(defaultSettings);
  }
}
