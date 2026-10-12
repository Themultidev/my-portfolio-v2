// Generated from the frozen static source; run node scripts/bind-content-components.mjs.
import EditableText from "../editor/EditableText";
import EditableElement from "../editor/EditableElement";
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
                <EditableText blockKey="overview.text.001">
                  {"Face Attendance System"}
                </EditableText>
              </h1>{" "}
              <a href={"https://github.com/Themultidev/attendanceSystem"}>
                <EditableElement
                  tag="img"
                  blockKeys={{ alt: "overview.alt.002" }}
                  elementProps={{
                    src: "/skillsimgs/github-svgrepo-com(1).svg",
                    className: "h-6 mt-2",
                    alt: "GitHub repository - Face Attendance System",
                  }}
                />
              </a>
              {"  "}
            </span>
            {"\n        \n  "}
            <span className={"inline-flex gap-2"}>
              <EditableText blockKey="overview.text.003">{" By"}</EditableText>
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
                  <EditableText blockKey="overview.text.004">
                    {"Themultidev"}
                  </EditableText>
                </p>{" "}
                <EditableElement
                  tag="img"
                  blockKeys={{ alt: "overview.alt.005" }}
                  elementProps={{
                    src: "/skillsimgs/github-svgrepo-com(1).svg",
                    className: "h-4 ",
                    alt: "GitHub icon",
                  }}
                />{" "}
              </a>{" "}
            </span>
            {"\n  \n        "}
            <p>
              <EditableText blockKey="overview.text.006">
                {"Worlu Prince"}
              </EditableText>
            </p>
            {"\n      "}
          </div>
          {"\n      \n      "}
          <div className={"text-sm text-slate-500"}>
            <EditableText blockKey="overview.text.007">
              {
                "Compact system overview • Student registration • Lecturer portal • Verification"
              }
            </EditableText>
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
          <h2 className={"text-2xl font-bold"}>
            <EditableText blockKey="overview.text.008">
              {"System at a glance"}
            </EditableText>
          </h2>
          {"\n      "}
          <p className={"mt-2 text-slate-600"}>
            <EditableText blockKey="overview.text.009">
              {
                "A lightweight attendance system that uses face embeddings stored in Google Sheets. Lecturers generate time-bound, WiFi-restricted verification links; students verify their faces and have attendance automatically marked on the lecturer sheet."
              }
            </EditableText>
          </p>
          {"\n    "}
        </section>
        {"\n\n    \n    "}
        <section className={"p-6 rounded-2xl"}>
          {"\n      "}
          <h3 className={"text-xl font-bold mb-4"}>
            <EditableText blockKey="overview.text.010">
              {"1. Architecture & Flow"}
            </EditableText>
          </h3>
          {"\n\n      "}
          <div className={"grid grid-cols-1 md:grid-cols-3 gap-4"}>
            {"\n        "}
            <div className={"p-4 rounded-lg border card"}>
              {"\n          "}
              <h4 className={"font-semibold"}>
                <EditableText blockKey="overview.text.011">
                  {"Student Registration"}
                </EditableText>
              </h4>
              {"\n          "}
              <ul
                className={
                  "mt-2 text-sm text-slate-600 space-y-1 list-disc pl-4"
                }
              >
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.012">
                    {
                      "Frontend form collects Name, Matric No, Email, Face Embedding (128-d)"
                    }
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.013">
                    {"Saves complete record to "}
                  </EditableText>
                  <strong>
                    <EditableText blockKey="overview.text.014">
                      {"Main Google Sheet (Registration Sheet)"}
                    </EditableText>
                  </strong>
                  <EditableText blockKey="overview.text.015">
                    {"."}
                  </EditableText>
                </li>
                {"\n          "}
              </ul>
              {"\n          "}
              <EditableElement
                tag="img"
                blockKeys={{ alt: "overview.alt.016" }}
                elementProps={{
                  className: "mt-2",
                  src: "/overviewimgs/student-reg-with-css2.png",
                  alt: "Student registration UI — Face Attendance System (front-end form screenshot)",
                }}
              />
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className={"p-4 rounded-lg border card"}>
              {"\n          "}
              <h4 className={"font-semibold"}>
                <EditableText blockKey="overview.text.017">
                  {"Lecturer Portal"}
                </EditableText>
              </h4>
              {"\n          "}
              <ul
                className={
                  "mt-2 text-sm text-slate-600 space-y-1 list-disc pl-4"
                }
              >
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.018">
                    {
                      "Generate class-specific verification links with encrypted tokens."
                    }
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.019">
                    {
                      "Tokens include: class date/column name, expiry timestamp, WiFi/IP constraints."
                    }
                  </EditableText>
                </li>
                {"\n          "}
              </ul>
              {"\n          "}
              <EditableElement
                tag="img"
                blockKeys={{ alt: "overview.alt.020" }}
                elementProps={{
                  className: "mt-2",
                  src: "/overviewimgs/on-generate-link.png",
                  alt: "Lecturer portal — generate tokenized verification link UI",
                }}
              />
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className={"p-4 rounded-lg border card"}>
              {"\n          "}
              <h4 className={"font-semibold"}>
                <EditableText blockKey="overview.text.021">
                  {"Verification Service"}
                </EditableText>
              </h4>
              {"\n          "}
              <ul
                className={
                  "mt-2 text-sm text-slate-600 space-y-1 list-disc pl-4"
                }
              >
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.022">
                    {"Verifies token conditions (time, WiFi/IP)."}
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.023">
                    {
                      'Runs face matching against Registration Sheet; if match found, marks "Present" on Lecturer Sheet for the appropriate class column.'
                    }
                  </EditableText>
                </li>
                {"\n          "}
              </ul>
              {"\n          "}
              <EditableElement
                tag="img"
                blockKeys={{ alt: "overview.alt.024" }}
                elementProps={{
                  className: "mt-2",
                  src: "/overviewimgs/mat-now-show-verification.png",
                  alt: "Verification page UI — face matching and confirmation",
                }}
              />
              {"\n          \n        "}
            </div>
            {"\n      "}
          </div>
          {"\n\n     \n      "}
          <div className={"mt-6 p-4 rounded-lg bg-white border shadow-sm"}>
            {"\n        "}
            <h5 className={"font-semibold"}>
              <EditableText blockKey="overview.text.025">
                {"Quick flow diagram"}
              </EditableText>
            </h5>
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
                  <EditableText blockKey="overview.text.026">
                    {"🧑‍🎓"}
                  </EditableText>
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  <EditableText blockKey="overview.text.027">
                    {"Student registers → embedding saved"}
                  </EditableText>
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className={"text-3xl"}>
                <EditableText blockKey="overview.text.028">{"➡️"}</EditableText>
              </div>
              {"\n          "}
              <div className={"flex-1 text-center p-4"}>
                {"\n            "}
                <div
                  className={
                    "p-3 rounded-full bg-amber-50 mx-auto inline-block"
                  }
                >
                  <EditableText blockKey="overview.text.029">
                    {"👩‍🏫"}
                  </EditableText>
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  <EditableText blockKey="overview.text.030">
                    {"Lecturer generates tokenized link"}
                  </EditableText>
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className={"text-3xl"}>
                <EditableText blockKey="overview.text.031">{"➡️"}</EditableText>
              </div>
              {"\n          "}
              <div className={"flex-1 text-center p-4"}>
                {"\n            "}
                <div
                  className={
                    "p-3 rounded-full bg-emerald-50 mx-auto inline-block"
                  }
                >
                  <EditableText blockKey="overview.text.032">
                    {"🔐"}
                  </EditableText>
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  <EditableText blockKey="overview.text.033">
                    {"Verification page checks token, WiFi & time"}
                  </EditableText>
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className={"text-3xl"}>
                <EditableText blockKey="overview.text.034">{"➡️"}</EditableText>
              </div>
              {"\n          "}
              <div className={"flex-1 text-center p-4"}>
                {"\n            "}
                <div
                  className={"p-3 rounded-full bg-rose-50 mx-auto inline-block"}
                >
                  <EditableText blockKey="overview.text.035">
                    {"✅"}
                  </EditableText>
                </div>
                {"\n            "}
                <div className={"mt-2 text-sm"}>
                  <EditableText blockKey="overview.text.036">
                    {"Match → Mark & update Lecturer Sheet"}
                  </EditableText>
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
            <EditableText blockKey="overview.text.037">
              {"2. Data schema (Google Sheets)"}
            </EditableText>
          </h3>
          {"\n\n      "}
          <div className={"mt-3 grid grid-cols-1 md:grid-cols-2 gap-4"}>
            {"\n        "}
            <div>
              {"\n          "}
              <h4 className={"font-semibold"}>
                <EditableText blockKey="overview.text.038">
                  {"Registration Sheet (Main)"}
                </EditableText>
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
                    <th className={"pr-4"}>
                      <EditableText blockKey="overview.text.039">
                        {"Name"}
                      </EditableText>
                    </th>
                    <th className={"pr-4"}>
                      <EditableText blockKey="overview.text.040">
                        {"Matric No"}
                      </EditableText>
                    </th>
                    <th className={"pr-4"}>
                      <EditableText blockKey="overview.text.041">
                        {"Email"}
                      </EditableText>
                    </th>
                    <th>
                      <EditableText blockKey="overview.text.042">
                        {"Embedding"}
                      </EditableText>
                    </th>
                    {"\n              "}
                  </tr>
                  {"\n            "}
                </thead>
                {"\n            "}
                <tbody className={"text-sm"}>
                  {"\n              "}
                  <tr className={"border-t"}>
                    <td>
                      <EditableText blockKey="overview.text.043">
                        {"Ada"}
                      </EditableText>
                    </td>
                    <td>
                      <EditableText blockKey="overview.text.044">
                        {"CS/1001"}
                      </EditableText>
                    </td>
                    <td>
                      <EditableText blockKey="overview.text.045">
                        {"ada@uni.edu"}
                      </EditableText>
                    </td>
                    <td>
                      <EditableText blockKey="overview.text.046">
                        {"128-d array"}
                      </EditableText>
                    </td>
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
                <EditableText blockKey="overview.text.047">
                  {"Lecturer Sheet (Attendance)"}
                </EditableText>
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
                    <th className={"pr-4"}>
                      <EditableText blockKey="overview.text.048">
                        {"Name"}
                      </EditableText>
                    </th>
                    <th className={"pr-4"}>
                      <EditableText blockKey="overview.text.049">
                        {"Matric No"}
                      </EditableText>
                    </th>
                    <th>
                      <EditableText blockKey="overview.text.050">
                        {"Class 1 (Apr 25)"}
                      </EditableText>
                    </th>
                    <th>
                      <EditableText blockKey="overview.text.051">
                        {"Class 2 (May 2)"}
                      </EditableText>
                    </th>
                    {"\n              "}
                  </tr>
                  {"\n            "}
                </thead>
                {"\n            "}
                <tbody className={"text-sm"}>
                  {"\n              "}
                  <tr className={"border-t"}>
                    <td>
                      <EditableText blockKey="overview.text.052">
                        {"Ada"}
                      </EditableText>
                    </td>
                    <td>
                      <EditableText blockKey="overview.text.053">
                        {"CS/1001"}
                      </EditableText>
                    </td>
                    <td />
                    <td>
                      <EditableText blockKey="overview.text.054">
                        {"Present"}
                      </EditableText>
                    </td>
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
            <EditableText blockKey="overview.text.055">
              {"3. Token example & verification logic"}
            </EditableText>
          </h3>
          {"\n      "}
          <p className={"mt-2 text-slate-600"}>
            <EditableText blockKey="overview.text.056">
              {
                "Tokens are short opaque strings produced by the server. They include encrypted data such as the class column label, expiry timestamp, and allowed WiFi/ IP pattern."
              }
            </EditableText>
          </p>
          {"\n\n      "}
          <div className={"mt-4 bg-white border rounded p-4"}>
            {"\n        "}
            <h4 className={"font-semibold"}>
              <EditableText blockKey="overview.text.057">
                {"Example (pseudo)"}
              </EditableText>
            </h4>
            {"\n        "}
            <EditableText
              as="pre"
              blockKey="overview.text.058"
              elementProps={{ className: "text-sm" }}
            >
              {
                '/verify?token=ENCRYPTED_DATA ENCRYPTED_DATA -> { "classColumn": "Class 4 (May 9)", "expiry": 1683655200, "wifi": "DEPT-LAB-SSID", "allowedIps": ["10.0.1.0/24"] }'
              }
            </EditableText>
            {"\n      "}
          </div>
          {"\n\n      "}
          <div className={"mt-4 grid md:grid-cols-2 gap-4"}>
            {"\n        "}
            <div className={"p-4 card rounded"}>
              {"\n          "}
              <h5 className={"font-medium"}>
                <EditableText blockKey="overview.text.059">
                  {"Verification check flow (server)"}
                </EditableText>
              </h5>
              {"\n          "}
              <ol className={"list-decimal pl-6 mt-2 text-sm text-slate-600"}>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.060">
                    {"Decode and decrypt token."}
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.061">
                    {"Ensure current time < expiry."}
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.062">
                    {
                      "Check student's client WiFi name or IP address matches constraints."
                    }
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.063">
                    {
                      "If allowed, run face matching against Registration Sheet."
                    }
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.064">
                    {
                      'If match found, retrieve matricNo and update Lecturer Sheet at the target column with "Present" (idempotent write).'
                    }
                  </EditableText>
                </li>
                {"\n          "}
              </ol>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className={"p-4 rounded card"}>
              {"\n          "}
              <h5 className={"font-medium"}>
                <EditableText blockKey="overview.text.065">
                  {"Idempotency & safety"}
                </EditableText>
              </h5>
              {"\n          "}
              <ul className={"list-disc pl-6 mt-2 text-sm text-slate-600"}>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.066">
                    {
                      'Do not overwrite an existing cell unless desired; only set "Present" if cell is blank.'
                    }
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.067">
                    {
                      "Log successful writes with timestamp and verified matricNo."
                    }
                  </EditableText>
                </li>
                {"\n            "}
                <li>
                  <EditableText blockKey="overview.text.068">
                    {"Rate-limit verification requests to avoid abuse."}
                  </EditableText>
                </li>
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
          <h3 className={"text-xl font-bold"}>
            <EditableText blockKey="overview.text.069">
              {"4. Implementation notes"}
            </EditableText>
          </h3>
          {"\n      "}
          <div className={"prose text-sm mt-3"}>
            {"\n        "}
            <ul className={"list-inside space-y-2"}>
              {"\n          "}
              <li>
                <strong>
                  <EditableText blockKey="overview.text.070">
                    {"Frontend:"}
                  </EditableText>
                </strong>
                <EditableText blockKey="overview.text.071">
                  {
                    " simple React or vanilla JS page that captures face, computes embedding (face-api.js), and POSTs to the verification endpoint."
                  }
                </EditableText>
              </li>
              {"\n          "}
              <li>
                <strong>
                  <EditableText blockKey="overview.text.072">
                    {"Server:"}
                  </EditableText>
                </strong>
                <EditableText blockKey="overview.text.073">
                  {
                    " Node.js/Express that issues encrypted tokens, validates token + constraints, and updates Google Sheets via the Google Sheets API using a service account."
                  }
                </EditableText>
              </li>
              {"\n          "}
              <li>
                <strong>
                  <EditableText blockKey="overview.text.074">
                    {"Security:"}
                  </EditableText>
                </strong>
                <EditableText blockKey="overview.text.075">
                  {
                    " use strong encryption for tokens (AES or RSA), store secrets in environment variables, verify token timestamps carefully."
                  }
                </EditableText>
              </li>
              {"\n          "}
              <li>
                <strong>
                  <EditableText blockKey="overview.text.076">
                    {"Face matching:"}
                  </EditableText>
                </strong>
                <EditableText blockKey="overview.text.077">
                  {
                    " cosine similarity threshold (e.g., 0.45-0.6 depending on model). Pre-normalize embeddings before comparing."
                  }
                </EditableText>
              </li>
              {"\n          "}
              <li>
                <strong>
                  <EditableText blockKey="overview.text.078">
                    {"Deployment:"}
                  </EditableText>
                </strong>
                <EditableText blockKey="overview.text.079">
                  {
                    " host verification page on Render, Vercel, or similar; server can be a separate Render service. Keep CORS and CSP tight."
                  }
                </EditableText>
              </li>
              {"\n        "}
            </ul>
            {"\n      "}
          </div>
          {"\n    "}
        </section>
        {"\n\n    "}
        <footer className={"p-6 text-sm text-slate-500 text-center"}>
          <EditableText blockKey="overview.text.080">
            {
              "\n      Built for quick specification & handoff — copy, adapt, and implement. \n    "
            }
          </EditableText>
        </footer>
        {"\n  "}
      </main>
      {"\n\n\n"}
    </>
  );
}
