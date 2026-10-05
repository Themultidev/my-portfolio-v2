// Ported from the static HTML. Preserve classes and markup during migration.
export default function Home() {
  return (
    <>
      {"  "}
      <section
        className={
          " min-h-[100vh] md:h-full text-center text-white flex flex-col justify-center items-center   space-y-4 px-5 md:px-20 md:py-30 "
        }
        id={"home"}
      >
        {"\n  "}
        <div
          className={
            "border-2 border-dashed rounded-full border-cyan-400 animate-pulse"
          }
        >
          {" "}
          <img
            className={"w-full h-40 max-w-[160px] rounded-full object-cover"}
            src={"/mypictop.jpg"}
            alt={"Worlu Prince — Front-end Developer avatar"}
          />{" "}
        </div>
        {"\n    "}
        <div className={"font-mono text-2xl font-bold"}>
          {"Hello 👋, i am   "}
        </div>
        {"\n    "}
        <div className={"text-4xl md:text-[40px] font-bold font-[Michroma]"}>
          <h1>
            <span className={"text-cyan-400"}>{"WO"}</span>
            {"RLU "}
            <span
              className={
                "text-transparent bg-gradient-to-r from-yellow-300 to-cyan-400 bg-clip-text "
              }
            >
              {"PRINCE"}
            </span>
            {" (JNR)"}
          </h1>
        </div>
        {"\n    "}
        <div className={"text-[15px]"}>
          <p>{"A Full Stack Web and AI developer"}</p>
        </div>
        {"\n    "}
        <div>
          <p className={"leading-loose "}>
            {
              " Multitalented personality and a sharp-witted learner with great attention to detail."
            }
          </p>
        </div>
        {"\n    "}
        <div className={"flex space-x-2"}>
          {"\n      "}
          <a
            className={
              "p-3 font-bold text-black transition-all border-2 w-fit h-fit rounded-4xl border-zinc-600 bg-zinc-100 hover:bg-black hover:text-white"
            }
            href={"#contact"}
          >
            {"Connect With Me!"}
          </a>
          {"\n      "}
          <a
            className={
              "p-3 font-sm text-zinc-8 transition-all border w-fit h-fit rounded-4xl border-zinc-400 bg-linear-to-r from-[#1e2228] via-[#6b727a] via-[#e2e5ea] to-[#2a2f36] hover:bg-black hover:text-white"
            }
            href={"#contact"}
          >
            {" View "}
            <span className={"text-zinc-800 font-mono font-bold text-md"}>
              {"Prjo"}
            </span>
            {"ects"}
          </a>
          {"\n    "}
        </div>
        {"\n\n  "}
      </section>
      {"\n"}
    </>
  );
}
