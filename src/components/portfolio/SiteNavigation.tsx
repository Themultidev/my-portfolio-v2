"use client";
import EditableText from "../editor/EditableText";
import EditableSiteLink from "../editor/EditableSiteLink";
import ThemeToggle from "./ThemeToggle";
import SiteIcon from "./SiteIcon";
export default function SiteNavigation() {
  return (
    <>
      <header className="site-header classic-navbar">
        <a
          href="https://github.com/Themultidev"
          className="wordmark"
          target="_blank"
          rel="noreferrer"
        >
          <EditableText blockKey="desktopNavigation.text.001">
            Themultidev
          </EditableText>
          <SiteIcon name="github" />
        </a>
        <nav className="site-links" aria-label="Main navigation">
          {(
            [
              ["Home", "home", "002", "home"],
              ["About", "about", "003", "about"],
              ["Projects", "projects", "004", "projects"],
              ["Contact", "contact", "005", "contact"],
            ] as const
          ).map(([name, anchor, key, icon]) => (
            <a className="nav-item" href={"/#" + anchor} key={anchor}>
              <SiteIcon className="nav-item-icon" name={icon} />
              <span className="nav-item-label">
                <EditableText blockKey={"desktopNavigation.text." + key}>
                  {name}
                </EditableText>
              </span>
            </a>
          ))}
          <EditableSiteLink
            kind="resume"
            elementProps={{
              href: "",
              className: "nav-item nav-resume outline-button",
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            <SiteIcon name="resume" className="nav-item-icon" />
            <span className="nav-item-label">
              <EditableText blockKey="desktopNavigation.text.006">
                Resume
              </EditableText>
            </span>
          </EditableSiteLink>
          <a href="/blog" className="nav-item blog-nav">
            <SiteIcon name="blog" className="nav-item-icon" />
            <span className="nav-item-label">Blog</span>
            <SiteIcon name="arrow-up-right" className="nav-link-arrow" />
          </a>
        </nav>
        <div className="navbar-socials">
          <EditableSiteLink
            kind="x"
            elementProps={{
              href: "https://x.com/skcodes__?s=21",
              className: "navbar-social",
              target: "_blank",
              rel: "noreferrer",
              "aria-label": "X profile",
            }}
          >
            <SiteIcon name="x" />
          </EditableSiteLink>
          <EditableSiteLink
            kind="linkedin"
            elementProps={{
              href: "https://www.linkedin.com/in/worlu-prince-796449376",
              className: "navbar-social",
              target: "_blank",
              rel: "noreferrer",
              "aria-label": "LinkedIn profile",
            }}
          >
            <SiteIcon name="linkedin" />
          </EditableSiteLink>
        </div>
        <ThemeToggle />
      </header>
      <div className="desktop-nav-spacer" aria-hidden="true" />
    </>
  );
}
