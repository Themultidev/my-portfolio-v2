"use client";
import { useEditMode } from "../editor/EditModeProvider";
import {
  parseSettings,
  SETTINGS_KEY,
  skillGroups,
  skillLabels,
} from "../../lib/site-settings";
export default function TechnicalSkills() {
  const editor = useEditMode();
  const settings = parseSettings(editor?.blocks[SETTINGS_KEY]?.value);
  return (
    <div className="technical-skills">
      <div className="section-heading">
        <h3>
          Technical skills<span className="accent">.</span>
        </h3>
        {editor?.editable && (
          <a className="accent-button" href="/admin/settings">
            + Add technical stack
          </a>
        )}
      </div>
      <div className="skills-columns">
        {skillGroups.map((group) => (
          <div key={group}>
            <span className="eyebrow">{skillLabels[group]}</span>
            <ul>
              {settings.skills
                .filter((s) => s.group === group)
                .map((s) => (
                  <li key={s.id}>
                    {s.iconPath && (
                      <img src={s.iconPath} width="24" height="24" alt="" />
                    )}
                    <span>{s.name}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
