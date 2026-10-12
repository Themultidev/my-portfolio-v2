// Generated from the frozen static source; run node scripts/bind-content-components.mjs.
import EditableText from "../editor/EditableText";
export default function Footer() {
  return (
    <>
      <section className={"flex items-center justify-center "} id={"footer"}>
        {"\n    "}
        <p className={"text-lg font-semibold"}>
          <EditableText blockKey="footer.text.001">{"Made with "}</EditableText>
          <span className={"animate-ping"}>
            <EditableText blockKey="footer.text.002">{"❤️"}</EditableText>
          </span>
          <EditableText blockKey="footer.text.003">
            {" by Prince."}
          </EditableText>
        </p>
        {"\n  "}
      </section>
    </>
  );
}
