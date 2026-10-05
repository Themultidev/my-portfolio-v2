// Ported from the static HTML. Preserve classes and markup during migration.
export default function Footer() {
  return (
    <>
      {"  "}
      <section className={"flex items-center justify-center "} id={"footer"}>
        {"\n    "}
        <p className={"text-lg font-semibold"}>
          {"Made with "}
          <span className={"animate-ping"}>{"❤️"}</span>
          {" by Prince."}
        </p>
        {"\n  "}
      </section>
      {"\n"}
    </>
  );
}
