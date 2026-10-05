// Ported from the static HTML. Preserve classes and markup during migration.
export default function OverviewHead() {
  return (
    <>
      <meta charSet={"utf-8"} />
      <meta name={"viewport"} content={"width=device-width,initial-scale=1"} />
      <title>{"Face Attendance System — Overview | Worlu Prince"}</title>
      <meta
        name={"description"}
        content={
          "Overview of the Face Attendance System — a lightweight face-recognition attendance solution with student registration, lecturer portal and tokenized verification. Built by Worlu Prince (Front-end developer)."
        }
      />
      <meta
        property={"og:title"}
        content={"Face Attendance System — Overview"}
      />
      <meta
        property={"og:description"}
        content={
          "Overview of a face-recognition attendance system: student registration, lecturer portal, verification flow and architecture."
        }
      />
      <meta property={"og:type"} content={"article"} />
      <link
        rel={"canonical"}
        href={"https://yourdomain.example/overview.html"}
      />
      <style
        dangerouslySetInnerHTML={{
          __html:
            "\n    \n    .card { background: linear-gradient(180deg, rgba(255,255,255,0.8), rgba(250,250,255,0.8)); }\n    pre { white-space: pre-wrap; }\n  ",
        }}
      />
    </>
  );
}
