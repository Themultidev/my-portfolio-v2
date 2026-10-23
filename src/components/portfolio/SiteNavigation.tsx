"use client";
import { useState } from "react";
import EditableText from "../editor/EditableText";
import EditableSiteLink from "../editor/EditableSiteLink";
import ThemeToggle from "./ThemeToggle";
export default function SiteNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <a href="/" className="wordmark">
          <span className="brand-mark">
            w<span>.</span>
          </span>
          <EditableText blockKey="desktopNavigation.text.001">
            Themultidev
          </EditableText>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
        <nav
          className={open ? "site-links is-open" : "site-links"}
          aria-label="Main navigation"
          onClick={() => setOpen(false)}
        >
          {[
            ["Home", "home", "002"],
            ["About", "about", "003"],
            ["Projects", "projects", "004"],
            ["Contact", "contact", "005"],
          ].map(([name, anchor, key]) => (
            <a href={`/#${anchor}`} key={anchor}>
              <EditableText blockKey={`desktopNavigation.text.${key}`}>
                {name}
              </EditableText>
            </a>
          ))}
          <EditableSiteLink
            kind="resume"
            elementProps={{
              href: "",
              className: "outline-button",
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            <EditableText blockKey="desktopNavigation.text.006">
              Resume
            </EditableText>
            <span aria-hidden="true">↗</span>
          </EditableSiteLink>
          <a href="/blog" className="blog-nav">
            Blog <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <ThemeToggle />
      </header>
      <div className="desktop-nav-spacer" aria-hidden="true" />
    </>
  );
}
