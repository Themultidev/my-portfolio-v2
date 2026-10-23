import SiteIcon from "./SiteIcon";
import EditableElement from "../editor/EditableElement";
import EditableSiteLink from "../editor/EditableSiteLink";
import EditableText from "../editor/EditableText";
const E = EditableText;
export default function Home() {
  return (
    <section id="home" className="new-hero">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="status-dot" />
          <E blockKey="hero.text.002">Hello 👋, I am</E>
        </p>
        <h1>
          <E blockKey="hero.text.003">WO</E>
          <E blockKey="hero.text.004">RLU </E>
          <br />
          <span className="name-outline">
            <E blockKey="hero.text.005">PRINCE</E>
          </span>
          <small>
            <E blockKey="hero.text.006"> (JNR)</E>
          </small>
          <span className="accent">.</span>
        </h1>
        <div className="hero-description">
          <span className="hero-rule" />
          <div>
            <h2>
              <E blockKey="hero.text.007">A Full Stack Web and AI developer</E>
            </h2>
            <p>
              <E blockKey="hero.text.008" multiline>
                Multitalented personality and a sharp-witted learner with great
                attention to detail.
              </E>
            </p>
          </div>
        </div>
        <div className="hero-actions">
          <a className="accent-button" href="#contact">
            <E blockKey="hero.text.009">Connect With Me!</E>{" "}
            <SiteIcon name="arrow-up-right" />
          </a>
          <a className="text-button" href="#projects">
            <E blockKey="hero.text.010">View </E>
            <E blockKey="hero.text.011">Prjo</E>
            <E blockKey="hero.text.012">ects</E> <SiteIcon name="arrow-down" />
          </a>
        </div>
        <div className="hero-socials">
          <a
            href="https://github.com/Themultidev"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <SiteIcon name="arrow-up-right" />
          </a>
          <EditableSiteLink
            kind="x"
            elementProps={{
              href: "https://x.com/skcodes__?s=21",
              target: "_blank",
              rel: "noreferrer",
            }}
          >
            <E blockKey="desktopNavigation.text.007">X</E>{" "}
            <SiteIcon name="arrow-up-right" />
          </EditableSiteLink>
          <EditableSiteLink
            kind="linkedin"
            elementProps={{
              href: "https://www.linkedin.com/in/worlu-prince-796449376",
              target: "_blank",
              rel: "noreferrer",
            }}
          >
            <E blockKey="desktopNavigation.text.008">LinkedIn</E>{" "}
            <SiteIcon name="arrow-up-right" />
          </EditableSiteLink>
        </div>
      </div>
      <div className="hero-portrait">
        <div className="portrait-orbit" />
        <div className="portrait-frame">
          <EditableElement
            tag="img"
            blockKeys={{ alt: "hero.alt.001" }}
            elementProps={{
              src: "/mypictop.jpg",
              alt: "Worlu Prince",
              width: 480,
              height: 600,
              fetchPriority: "high",
            }}
          />
        </div>
        <span className="portrait-caption">THE PERSON BEHIND THE CODE</span>
        <span className="hero-coordinate">01 / BUILDING WITH PURPOSE</span>
        <span className="portrait-spark" aria-hidden="true">
          <SiteIcon name="star" />
        </span>
      </div>
    </section>
  );
}
