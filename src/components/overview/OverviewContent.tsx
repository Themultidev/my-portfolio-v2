// Ported from the static HTML. Preserve classes and markup during migration.
export default function OverviewContent() {
  return (
    <>
      {"\n  "}
      <header className={"max-w-5xl mx-auto p-6"}>
        {"\n    "}
        <div
          className={
            "flex items-center flex-col md:flex-row space-x-3 justify-between space-y-5"
          }
        >
          {"\n      "}
          <div>
            {"\n  "}
            <span className={"inline-flex gap-2 items-center justify-center"}>
              {" "}
              <h1 className={"text-3xl font-extrabold"}>
                {"Face Attendance System"}
              </h1>{" "}
              <a href={"https://github.com/Themultidev/attendanceSystem"}>
                <img
                  src={"/skillsimgs/github-svgrepo-com(1).svg"}
                  className={"h-6 mt-2"}
                  alt={"GitHub repository - Face Attendance System"}
                />
              </a>
              {"  "}
            </span>
            {"\n        \n  "}
            <span className={"inline-flex gap-2"}>
              {" By"}
              <a
                href={"https://github.com/Themultidev"}
                className={"  inline-flex gap-1 items-center"}
              >
                {" "}
                <p
                  className={
                    "underline decoration-2 decoration-blue-500 font-bold "
                  }
                >
                  {"Themultidev"}
                </p>{" "}
                <img
                  src={"/skillsimgs/github-svgrepo-com(1).svg"}
                  className={"h-4 "}
                  alt={"GitHub icon"}
                />{" "}
              </a>{" "}
            </span>
            {"\n  \n        "}
            <p>{"Worlu Prince"}</p>
            {"\n      "}
          </div>
          {"\n      \n      "}
          <div className={"text-sm text-slate-500"}>
            {
              "Compact system overview • Student registration • Lecturer portal • Verification"
            }
          </div>
          {"\n    "}
        </div>
        {"\n  "}
      </header>
      {"\n\n  "}
      <main className={"max-w-5xl mx-auto p-6 space-y-8"}>
        {"\n   \n    "}
        <section className={"card p-6 rounded-2xl shadow"}>
          {"\n      "}
          <h2 className={"text-2xl font-bold"}>{"System at a glance"}</h2>
          {"\n      "}
          <p className={"mt-2 text-slate-600"}>
            {
              "A lightweight attendance system that uses face embeddings stored in Google Sheets. Lecturers generate time-bound, WiFi-restricted verification links; students verify their faces and have attendance automatically marked on the lecturer sheet."
            }
          </p>
          {"\n    "}
        </section>
        {"\n\n    \n    "}
        <section className={"p-6 rounded-2xl"}>
          {"\n      "}
          <h3 className={"text-xl font-bold mb-4"}>
            {"1. Architecture & Flow"}
          </h3>
          {"\n\n      "}
          <div className={"grid grid-cols-1 md:grid-cols-3 gap-4"}>
            {"\n        "}
            <div className={"p-4 rounded-lg border card"}>
              {"\n          "}
              <h4 className={"font-semibold"}>{"Student Registration"}</h4>
              {"\n          "}
              <ul
                className={
                  "mt-2 text-sm text-slate-600 space-y-1 list-disc pl-4"
                }
              >
                {"\n            "}
                <li>
                  {
                    "Frontend form collects Name, Matric No, Email, Face Embedding (128-d)"
                  }
                </li>
                {"\n            "}
                <li>
                  {"Saves complete record to "}
                  <strong>{"Main Google Sheet (Registration Sheet)"}</strong>
                  {"."}
                </li>
                {"\n          "}
              </ul>
              {"\n          "}
              <img
                className={"mt-2"}
                src={"/overviewimgs/student-reg-with-css2.png"}
                alt={
                  "Student registration UI — Face Attendance System (front-end form screenshot)"
                }
              />
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className={"p-4 rounded-lg border card"}>
              {"\n          "}
              <h4 className={"font-semibold"}>{"Lecturer Portal"}</h4>
              {"\n          "}
              <ul
                className={
                  "mt-2 text-sm text-slate-600 space-y-1 list-disc pl-4"
                }
              >
                {"\n            "}
                <li>
                  {
                    "Generate class-specific verification links with encrypted tokens."
                  }
                </li>
                {"\n            "}
                <li>
                  {
                    "Tokens include: class date/column name, expiry timestamp, WiFi/IP constraints."
                  }
                </li>
                {"\n          "}
              </ul>
              {"\n          "}
              <img
                className={"mt-2"}
                src={"/overviewimgs/on-generate-link.png"}
                alt={
                  "Lecturer portal — generate tokenized verification link UI"
                }
              />
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className={"p-4 rounded-lg border card"}>
              {"\n          "}
              <h4 className={"font-semibold"}>{"Verification Service"}</h4>
              {"\n          "}
              <ul
                className={
                  "mt-2 text-sm text-slate-600 space-y-1 list-disc pl-4"
                }
              >
                {"\n            "}
                <li>{"Verifies token conditions (time, WiFi/IP)."}</li>
                {"\n            "}
                <li>
                  {
                    'Runs face matching against Registration Sheet; if match found, marks "Present" on Lecturer Sheet for the appropriate class column.'
                  }
                </li>
                {"\n          "}
              </ul>
              {"\n          "}
              <img
                className={"mt-2"}
                src={"/overviewimgs/mat-now-show-verification.png"}
                alt={"Verification page UI — face matching and confirmation"}
              />
              {"\n          \n        "}
            </div>
            {"\n      "}
          </div>
          {"\n\n     \n      "}
          <div className={"mt-6 p-4 rounded-lg bg-white border shadow-sm"}>
            {"\n        "}
            <h5 className={"font-semibold"}>{"Quick flow diagram"}</h5>
            {"\n        "}
            <div
              className={
                "mt-4 flex flex-col md:flex-row items-center justify-between gap-4"
              }
            >
              {"\n          "}
              <div className={"flex-1 text-center p-4"}>
                {"\n            "}
                <div
                  className={
                    "p-3 rounded-full bg-indigo-50 mx-auto inline-block"
                  }
                >
                  {"🧑‍🎓"}
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  {"Student registers → embedding saved"}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className={"text-3xl"}>{"➡️"}</div>
              {"\n          "}
              <div className={"flex-1 text-center p-4"}>
                {"\n            "}
                <div
                  className={
                    "p-3 rounded-full bg-amber-50 mx-auto inline-block"
                  }
                >
                  {"👩‍🏫"}
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  {"Lecturer generates tokenized link"}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className={"text-3xl"}>{"➡️"}</div>
              {"\n          "}
              <div className={"flex-1 text-center p-4"}>
                {"\n            "}
                <div
                  className={
                    "p-3 rounded-full bg-emerald-50 mx-auto inline-block"
                  }
                >
                  {"🔐"}
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  {"Verification page checks token, WiFi & time"}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className={"text-3xl"}>{"➡️"}</div>
              {"\n          "}
              <div className={"flex-1 text-center p-4"}>
                {"\n            "}
                <div
                  className={"p-3 rounded-full bg-rose-50 mx-auto inline-block"}
                >
                  {"✅"}
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  {"Match → Mark & update Lecturer Sheet"}
                </div>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n      "}
          </div>
          {"\n    "}
        </section>
        {"\n\n   \n    "}
        <section className={"p-6 rounded-2xl card"}>
          {"\n      "}
          <h3 className={"text-xl font-bold"}>
            {"2. Data schema (Google Sheets)"}
          </h3>
          {"\n\n      "}
          <div className={"mt-3 grid grid-cols-1 md:grid-cols-2 gap-4"}>
            {"\n        "}
            <div>
              {"\n          "}
              <h4 className={"font-semibold"}>{"Registration Sheet (Main)"}</h4>
              {"\n          "}
              <table
                className={"w-full mt-2 text-sm table-auto border-collapse"}
              >
                {"\n            "}
                <thead>
                  {"\n              "}
                  <tr className={"text-left text-xs text-slate-500"}>
                    {"\n                "}
                    <th className={"pr-4"}>{"Name"}</th>
                    <th className={"pr-4"}>{"Matric No"}</th>
                    <th className={"pr-4"}>{"Email"}</th>
                    <th>{"Embedding"}</th>
                    {"\n              "}
                  </tr>
                  {"\n            "}
                </thead>
                {"\n            "}
                <tbody className={"text-sm"}>
                  {"\n              "}
                  <tr className={"border-t"}>
                    <td>{"Ada"}</td>
                    <td>{"CS/1001"}</td>
                    <td>{"ada@uni.edu"}</td>
                    <td>{"128-d array"}</td>
                  </tr>
                  {"\n            "}
                </tbody>
                {"\n          "}
              </table>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div>
              {"\n          "}
              <h4 className={"font-semibold"}>
                {"Lecturer Sheet (Attendance)"}
              </h4>
              {"\n          "}
              <table
                className={"w-full mt-2 text-sm table-auto border-collapse"}
              >
                {"\n            "}
                <thead>
                  {"\n              "}
                  <tr className={"text-left text-xs text-slate-500"}>
                    {"\n                "}
                    <th className={"pr-4"}>{"Name"}</th>
                    <th className={"pr-4"}>{"Matric No"}</th>
                    <th>{"Class 1 (Apr 25)"}</th>
                    <th>{"Class 2 (May 2)"}</th>
                    {"\n              "}
                  </tr>
                  {"\n            "}
                </thead>
                {"\n            "}
                <tbody className={"text-sm"}>
                  {"\n              "}
                  <tr className={"border-t"}>
                    <td>{"Ada"}</td>
                    <td>{"CS/1001"}</td>
                    <td />
                    <td>{"Present"}</td>
                  </tr>
                  {"\n            "}
                </tbody>
                {"\n          "}
              </table>
              {"\n        "}
            </div>
            {"\n      "}
          </div>
          {"\n    "}
        </section>
        {"\n\n\n    "}
        <section className={"p-6 rounded-2xl"}>
          {"\n      "}
          <h3 className={"text-xl font-bold"}>
            {"3. Token example & verification logic"}
          </h3>
          {"\n      "}
          <p className={"mt-2 text-slate-600"}>
            {
              "Tokens are short opaque strings produced by the server. They include encrypted data such as the class column label, expiry timestamp, and allowed WiFi/ IP pattern."
            }
          </p>
          {"\n\n      "}
          <div className={"mt-4 bg-white border rounded p-4"}>
            {"\n        "}
            <h4 className={"font-semibold"}>{"Example (pseudo)"}</h4>
            {"\n        "}
            <pre className={"text-sm"}>
              {
                '/verify?token=ENCRYPTED_DATA ENCRYPTED_DATA -> { "classColumn": "Class 4 (May 9)", "expiry": 1683655200, "wifi": "DEPT-LAB-SSID", "allowedIps": ["10.0.1.0/24"] }'
              }
            </pre>
            {"\n      "}
          </div>
          {"\n\n      "}
          <div className={"mt-4 grid md:grid-cols-2 gap-4"}>
            {"\n        "}
            <div className={"p-4 card rounded"}>
              {"\n          "}
              <h5 className={"font-medium"}>
                {"Verification check flow (server)"}
              </h5>
              {"\n          "}
              <ol className={"list-decimal pl-6 mt-2 text-sm text-slate-600"}>
                {"\n            "}
                <li>{"Decode and decrypt token."}</li>
                {"\n            "}
                <li>{"Ensure current time < expiry."}</li>
                {"\n            "}
                <li>
                  {
                    "Check student's client WiFi name or IP address matches constraints."
                  }
                </li>
                {"\n            "}
                <li>
                  {"If allowed, run face matching against Registration Sheet."}
                </li>
                {"\n            "}
                <li>
                  {
                    'If match found, retrieve matricNo and update Lecturer Sheet at the target column with "Present" (idempotent write).'
                  }
                </li>
                {"\n          "}
              </ol>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className={"p-4 rounded card"}>
              {"\n          "}
              <h5 className={"font-medium"}>{"Idempotency & safety"}</h5>
              {"\n          "}
              <ul className={"list-disc pl-6 mt-2 text-sm text-slate-600"}>
                {"\n            "}
                <li>
                  {
                    'Do not overwrite an existing cell unless desired; only set "Present" if cell is blank.'
                  }
                </li>
                {"\n            "}
                <li>
                  {
                    "Log successful writes with timestamp and verified matricNo."
                  }
                </li>
                {"\n            "}
                <li>{"Rate-limit verification requests to avoid abuse."}</li>
                {"\n          "}
              </ul>
              {"\n        "}
            </div>
            {"\n      "}
          </div>
          {"\n    "}
        </section>
        {"\n\n    "}
        {"\n    "}
        <section className={"p-6 rounded-2xl card"}>
          {"\n      "}
          <h3 className={"text-xl font-bold"}>{"4. Implementation notes"}</h3>
          {"\n      "}
          <div className={"prose text-sm mt-3"}>
            {"\n        "}
            <ul className={"list-inside space-y-2"}>
              {"\n          "}
              <li>
                <strong>{"Frontend:"}</strong>
                {
                  " simple React or vanilla JS page that captures face, computes embedding (face-api.js), and POSTs to the verification endpoint."
                }
              </li>
              {"\n          "}
              <li>
                <strong>{"Server:"}</strong>
                {
                  " Node.js/Express that issues encrypted tokens, validates token + constraints, and updates Google Sheets via the Google Sheets API using a service account."
                }
              </li>
              {"\n          "}
              <li>
                <strong>{"Security:"}</strong>
                {
                  " use strong encryption for tokens (AES or RSA), store secrets in environment variables, verify token timestamps carefully."
                }
              </li>
              {"\n          "}
              <li>
                <strong>{"Face matching:"}</strong>
                {
                  " cosine similarity threshold (e.g., 0.45-0.6 depending on model). Pre-normalize embeddings before comparing."
                }
              </li>
              {"\n          "}
              <li>
                <strong>{"Deployment:"}</strong>
                {
                  " host verification page on Render, Vercel, or similar; server can be a separate Render service. Keep CORS and CSP tight."
                }
              </li>
              {"\n        "}
            </ul>
            {"\n      "}
          </div>
          {"\n    "}
        </section>
        {"\n\n    "}
        <footer className={"p-6 text-sm text-slate-500 text-center"}>
          {
            "\n      Built for quick specification & handoff — copy, adapt, and implement. \n    "
          }
        </footer>
        {"\n  "}
      </main>
      {"\n"}
    </>
  );
}
