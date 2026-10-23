import EditableElement from "../editor/EditableElement";
import EditableText from "../editor/EditableText";
import manifest from "../../../prisma/seed-data.json";
import TechnicalSkills from "./TechnicalSkills";
import AboutNotes from "./AboutNotes";
import GitHubActivity from "./GitHubActivity";
function Text({ n }: { n: number }) {
  const key = "about.text." + String(n).padStart(3, "0");
  return (
    <EditableText blockKey={key}>
      {manifest.content.find((b) => b.key === key)?.value ?? ""}
    </EditableText>
  );
}
export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A LITTLE CONTEXT</p>
          <h2>
            <Text n={3} />
            <span className="accent">.</span>
          </h2>
        </div>
        <span className="section-number">02 / ABOUT</span>
      </div>
      <div className="about-intro">
        <div className="about-photo">
          <EditableElement
            tag="img"
            blockKeys={{ alt: "about.alt.002" }}
            elementProps={{
              src: "/me.jpg",
              alt: "Worlu Prince",
              width: 240,
              height: 290,
              loading: "lazy",
            }}
          />
        </div>
        <div>
          <p className="about-lead">
            {[4, 5, 6, 7, 8, 9].map((n) => (
              <Text key={n} n={n} />
            ))}
          </p>
          <AboutNotes />
        </div>
      </div>
      <div className="about-background">
        <div>
          <h3>
            <Text n={11} />
          </h3>
          {[
            [12, 13, 14],
            [15, 16, 17],
            [18, 19, 20],
            [21, 22, 23],
          ].map((row) => (
            <p key={row[0]}>
              {row.map((n) => (
                <span key={n}>
                  <Text n={n} />{" "}
                </span>
              ))}
            </p>
          ))}
        </div>
        <div>
          <h3>
            <Text n={24} />
          </h3>
          <div className="qualification-list">
            {[
              [25, 26],
              [27, 28],
              [29, 30],
              [31, 32],
              [33, 34],
              [35, 36],
              [37],
            ].map((row) => (
              <p key={row[0]}>
                {row.map((n) => (
                  <span key={n}>
                    <Text n={n} />{" "}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
      <GitHubActivity />
      <TechnicalSkills />
      <details className="soft-skills">
        <summary>
          <Text n={53} /> <span>+</span>
        </summary>
        <div>
          {[54, 56, 58, 60].map((n) => (
            <div key={n}>
              <h4>
                <Text n={n} />
              </h4>
              <p>
                <Text n={n + 1} />
              </p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
