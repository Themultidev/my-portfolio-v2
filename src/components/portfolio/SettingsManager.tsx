"use client";
import { useState } from "react";
import {
  type SiteSettings,
  skillGroups,
  skillLabels,
} from "../../lib/site-settings";
import { uploadPortfolioFile } from "../../lib/upload-client";
import { useEditMode } from "../editor/EditModeProvider";
export default function SettingsManager({
  initial,
  icons,
}: {
  initial: SiteSettings;
  icons: { name: string; svgPath: string }[];
}) {
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const editor = useEditMode();
  function update(value: SiteSettings) {
    setSettings(value);
    editor?.setDirty("site-settings-form", true);
    setMessage("");
  }
  async function upload(file?: File, skillId?: string) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const path = await uploadPortfolioFile(file, skillId ? "stack" : "music");
      update(
        skillId
          ? {
              ...settings,
              skills: settings.skills.map((s) =>
                s.id === skillId ? { ...s, iconPath: path } : s,
              ),
            }
          : {
              ...settings,
              music: { ...settings.music, mode: "audio", source: path },
            },
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message ?? "Unable to save.");
      editor?.setDirty("site-settings-form", false);
      window.dispatchEvent(new Event("portfolio:saved"));
      setMessage("Settings saved. Refresh the portfolio to see your changes.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="studio-page">
      <a className="eyebrow" href="/admin/edit/portfolio">
        ← PORTFOLIO EDITOR
      </a>
      <h1>
        Make it yours<span className="accent">.</span>
      </h1>
      <p className="page-description">
        Your technical skills, GitHub activity and blog soundtrack, in one
        place.
      </p>
      <fieldset disabled={busy}>
        <section className="studio-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / YOUR TOOLKIT</p>
              <h2>Technical stack</h2>
            </div>
            <button
              type="button"
              className="accent-button"
              onClick={() =>
                update({
                  ...settings,
                  skills: [
                    ...settings.skills,
                    {
                      id: crypto.randomUUID(),
                      name: "New skill",
                      group: "languages",
                      iconPath: "",
                    },
                  ],
                })
              }
            >
              + Add technical stack
            </button>
          </div>
          <p className="help-text">
            Choose a catalog icon, or attach your own SVG/image to a skill.
            Project stack icons are managed separately in Stack icons.
          </p>
          {settings.skills.map((skill, index) => (
            <div className="skill-editor-row" key={skill.id}>
              {skill.iconPath ? (
                <img src={skill.iconPath} width="32" height="32" alt="" />
              ) : (
                <span className="icon-placeholder">+</span>
              )}
              <label>
                Name
                <input
                  aria-label={`Skill ${index + 1} name`}
                  value={skill.name}
                  maxLength={70}
                  onChange={(e) =>
                    update({
                      ...settings,
                      skills: settings.skills.map((s) =>
                        s.id === skill.id ? { ...s, name: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Column
                <select
                  value={skill.group}
                  onChange={(e) =>
                    update({
                      ...settings,
                      skills: settings.skills.map((s) =>
                        s.id === skill.id
                          ? {
                              ...s,
                              group: e.target.value as typeof skill.group,
                            }
                          : s,
                      ),
                    })
                  }
                >
                  {skillGroups.map((group) => (
                    <option key={group} value={group}>
                      {skillLabels[group]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Icon
                <select
                  value={
                    icons.some((i) => i.svgPath === skill.iconPath)
                      ? skill.iconPath
                      : ""
                  }
                  onChange={(e) =>
                    update({
                      ...settings,
                      skills: settings.skills.map((s) =>
                        s.id === skill.id
                          ? { ...s, iconPath: e.target.value }
                          : s,
                      ),
                    })
                  }
                >
                  <option value="">
                    {skill.iconPath ? "Custom / current icon" : "No icon"}
                  </option>
                  {icons.map((i) => (
                    <option key={i.svgPath} value={i.svgPath}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="upload-label">
                Upload SVG / image
                <input
                  type="file"
                  accept=".svg,image/png,image/jpeg,image/webp"
                  onChange={(e) => void upload(e.target.files?.[0], skill.id)}
                />
              </label>
              <button
                type="button"
                aria-label={`Move ${skill.name} up`}
                disabled={index === 0}
                onClick={() => {
                  const skills = [...settings.skills];
                  [skills[index - 1], skills[index]] = [
                    skills[index],
                    skills[index - 1],
                  ];
                  update({ ...settings, skills });
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="danger-text"
                aria-label={`Remove ${skill.name}`}
                onClick={() =>
                  update({
                    ...settings,
                    skills: settings.skills.filter((s) => s.id !== skill.id),
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
        </section>
        <section className="studio-panel">
          <p className="eyebrow">02 / BUILD IN PUBLIC</p>
          <h2>GitHub activity</h2>
          <label>
            GitHub username
            <input
              value={settings.githubUsername}
              maxLength={39}
              onChange={(e) =>
                update({ ...settings, githubUsername: e.target.value })
              }
            />
          </label>
          <p className="help-text">
            For higher API limits and a complete contribution calendar,
            optionally set GITHUB_TOKEN in the server environment. It is never
            sent to visitors.
          </p>
        </section>
        <section className="studio-panel">
          <p className="eyebrow">03 / SET THE MOOD</p>
          <h2>Blog soundtrack</h2>
          <div className="form-grid">
            <label>
              Player
              <select
                value={settings.music.mode}
                onChange={(e) =>
                  update({
                    ...settings,
                    music: {
                      ...settings.music,
                      mode: e.target.value as SiteSettings["music"]["mode"],
                      source: "",
                    },
                  })
                }
              >
                <option value="off">Off</option>
                <option value="audio">My uploaded audio</option>
                <option value="spotify">Spotify player</option>
                <option value="jam">Spotify Jam invite</option>
              </select>
            </label>
            <label>
              Display title
              <input
                value={settings.music.title}
                maxLength={100}
                onChange={(e) =>
                  update({
                    ...settings,
                    music: { ...settings.music, title: e.target.value },
                  })
                }
              />
            </label>
          </div>
          {settings.music.mode === "audio" ? (
            <>
              <label>
                Upload your music (MP3, WAV, OGG, M4A · up to 20 MB)
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a"
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
              </label>
              {settings.music.source && (
                <audio
                  controls
                  src={settings.music.source}
                  preload="metadata"
                />
              )}
            </>
          ) : (
            settings.music.mode !== "off" && (
              <label>
                {settings.music.mode === "jam"
                  ? "Spotify Jam invitation URL"
                  : "Spotify track, album or playlist URL"}
                <input
                  type="url"
                  value={settings.music.source}
                  placeholder="https://open.spotify.com/…"
                  onChange={(e) =>
                    update({
                      ...settings,
                      music: { ...settings.music, source: e.target.value },
                    })
                  }
                />
              </label>
            )
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.music.autoplay}
              onChange={(e) =>
                update({
                  ...settings,
                  music: { ...settings.music, autoplay: e.target.checked },
                })
              }
            />{" "}
            Attempt automatic playback
          </label>
          <p className="help-text">
            Audio attempts to start on arrival and retries on the first
            interaction if blocked. Browser and Spotify rules can still require
            Play. Jam opens Spotify’s invitation; the website cannot start or
            join a Jam for a visitor.
          </p>
        </section>
      </fieldset>
      <div className="studio-save">
        <button
          className="accent-button"
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? "Working…" : "Save settings"}
        </button>
        <p role="status">{message}</p>
      </div>
    </main>
  );
}
