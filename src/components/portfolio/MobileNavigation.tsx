// Ported from the static HTML. Preserve classes and markup during migration.
export default function MobileNavigation() {
  return (
    <>
      {"  "}
      <header className={"flex items-center justify-center lg:hidden"}>
        {"\n\n    "}
        <nav
          className={
            "h-16  p-2 flex gap-3  items-center justify-center  fixed top-15  z-50 bg-black/30 backdrop-blur-2xl rounded-3xl border-2 border-amber-200 scroll-behavior: smooth; animate-bounce-twice "
          }
        >
          {"\n      \n      "}
          <ul
            className={
              "flex items-center justify-center h-0 gap-5 p-4 border-r-2 border-r-gray-400"
            }
          >
            {"\n\n        "}
            <li
              className={
                "relative flex items-center justify-center transition-all group rounded-2xl hover:p-3 hover:bg-gradient-to-r from-yellow-300 to-cyan-400"
              }
            >
              {"\n          \n          "}
              <a href={"#home"}>
                {"\n            "}
                <svg
                  xmlns={"http://www.w3.org/2000/svg"}
                  width={"24"}
                  height={"24"}
                  viewBox={"0 0 24 24"}
                  fill={"none"}
                  stroke={"#ffffff"}
                  strokeWidth={"2"}
                  strokeLinecap={"round"}
                  strokeLinejoin={"round"}
                >
                  {"\n            "}
                  <path d={"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"} />
                  {"\n            "}
                  <polyline points={"9 22 9 12 15 12 15 22"} />
                  {"\n            "}
                </svg>
                {"\n            \n          "}
              </a>
              {"\n\n          "}
              <span
                className={
                  " p-1.5 top-15 rounded text-sm bg-zinc-700 absolute hidden group-hover:block "
                }
              >
                {"Home"}
              </span>
              {"\n        "}
            </li>
            {"\n\n        "}
            <li
              className={
                "relative flex items-center justify-center transition-all group rounded-2xl hover:p-3 hover:bg-gradient-to-r from-yellow-300 to-cyan-400"
              }
            >
              {"\n          "}
              <a href={"#about"}>
                {"\n\n            "}
                <svg
                  fill={"#ffffff"}
                  width={"25px"}
                  height={"25px"}
                  viewBox={"0 0 24 24"}
                  xmlns={"http://www.w3.org/2000/svg"}
                >
                  <path
                    d={
                      "M12,11A5,5,0,1,0,7,6,5.006,5.006,0,0,0,12,11Zm0-8A3,3,0,1,1,9,6,3,3,0,0,1,12,3ZM3,22V18a5.006,5.006,0,0,1,5-5h8a5.006,5.006,0,0,1,5,5v4a1,1,0,0,1-2,0V18a3,3,0,0,0-3-3H8a3,3,0,0,0-3,3v4a1,1,0,0,1-2,0Z"
                    }
                  />
                </svg>
                {"\n            \n          "}
              </a>
              {"\n          "}
              <span
                className={
                  " p-1.5 top-15 rounded text-sm bg-zinc-700 absolute hidden group-hover:block "
                }
              >
                {"About"}
              </span>
              {"\n\n        "}
            </li>
            {"\n\n        "}
            <li
              className={
                "relative flex items-center justify-center transition-all group rounded-2xl hover:p-3 hover:bg-gradient-to-r from-yellow-300 to-cyan-400"
              }
            >
              {"\n          "}
              <a className={"transition rounded-3xl"} href={"#projects"}>
                {"\n            "}
                <svg
                  fill={"#ffffff"}
                  width={"25px"}
                  height={"25px"}
                  viewBox={"0 0 1024 1024"}
                  xmlns={"http://www.w3.org/2000/svg"}
                >
                  <path
                    d={
                      "M960.496 415.056l-82.129-18.224c-6.4-20.48-14.784-40.08-24.4-58.927l44.431-74.032c16.592-26.512 24.976-65.52 0-90.512l-45.28-45.248c-24.976-24.992-67.151-20.496-92.623-2.832l-72.032 45.887c-18.689-9.696-38.225-18-58.529-24.56l-18.431-83.12C605.999 33.009 579.343 0 543.999 0h-64c-35.344 0-57.008 33.504-64 64l-20.528 82.128c-21.68 6.912-42.496 15.744-62.336 26.208l-73.84-47.024c-25.456-17.664-67.648-22.16-92.624 2.832l-45.264 45.248c-24.992 25.008-16.608 64 0 90.512l46.752 77.92c-8.767 17.664-16.544 35.936-22.544 55.024l-82.112 18.224C33.007 420.56 0 447.216 0 482.56v64c0 35.344 33.504 57.008 64 64l83.152 20.784c5.745 17.632 12.928 34.56 21.056 50.976l-46.8 78c-16.591 26.496-24.975 65.504 0 90.496l45.28 45.248c24.976 25.008 67.152 20.496 92.624 2.847l74-47.152c19.952 10.528 40.88 19.44 62.704 26.337L416.495 960c7.008 30.496 28.656 64 64 64h64c35.344 0 62-33.007 67.504-63.504l18.464-83.343c20.096-6.496 39.376-14.689 57.84-24.257l72.192 46c25.472 17.664 67.664 22.16 92.624-2.848L898.4 850.8c24.976-25.008 16.592-64 0-90.496l-44.463-74.128c8.944-17.568 16.688-35.84 22.912-54.848L960 610.56c30.496-7.008 64-28.656 64-64v-64c0-35.344-32.992-62-63.504-67.504zm-.465 126.992c-2.72 1.952-7.842 4.635-14.338 6.139l-118.656 29.631-11.008 33.632c-4.975 15.153-11.407 30.529-19.119 45.712l-16.064 31.569 62.688 104.528c4 6.4 5.872 12.127 6.432 15.503l-42.096 42.033c-4.064-1.28-8.688-2.945-10.912-4.464l-105.344-67.184-32.752 16.945c-15.776 8.192-31.969 14.976-48.097 20.192l-34.88 11.28-26.368 119.12c-1.216 6.368-4.624 11.504-6.96 13.344h-57.6c-1.951-2.72-4.623-7.84-6.112-14.32L449.39 827.9l-34.095-10.817c-17.569-5.536-35.088-12.912-52.144-21.904l-32.912-17.376-105.36 67.152c-4.304 2.912-8.912 4.56-13.088 4.56l-41.968-40.847c.56-3.311 2.304-8.783 5.792-14.367l65.456-109.056-15.568-31.344c-7.264-14.784-13.024-28.656-17.504-42.4l-10.992-33.664L79.518 548.46c-7.392-1.68-12.736-4.432-15.52-6.4v-59.504c.032.016.08.032.145.032 1.072 0 6.336-3.745 10.72-4.544l120.72-26.737 11.087-35.28c4.512-14.368 10.672-29.344 18.816-45.775l15.568-31.36-64.767-107.92c-4.016-6.432-5.872-12.16-6.432-15.52l42.08-42.065c4.08 1.312 8.672 2.96 10.88 4.48l107.312 68.4 32.88-17.344c16.88-8.895 34.336-16.239 51.904-21.823l34.016-10.832L478.11 79.501c1.697-7.391 4.416-12.735 6.4-15.52H544c-.433.657 3.68 6.24 4.527 10.865l26.88 121.408 34.848 11.264c16.336 5.28 32.752 12.16 48.72 20.448l32.752 17.008 103.152-65.712c4.32-2.945 8.944-4.576 13.088-4.576l42 40.816c-.56 3.328-2.32 8.816-5.808 14.416l-63.344 105.488 16.16 31.616c8.72 17.056 15.376 33.056 20.32 48.928l11.056 35.344L946.64 477.55c7.153 1.328 12.721 5.456 13.905 7.696zM512.43 319.674c-106.272 0-192.736 86.288-192.736 192.32 0 106.016 86.464 192.304 192.736 192.304s192.736-86.288 192.736-192.304c0-106.032-86.464-192.32-192.736-192.32zm-.432 320.32c-70.576 0-128-57.424-128-128 0-70.592 57.424-128 128-128 70.592 0 128 57.408 128 128 0 70.576-57.424 128-128 128z"
                    }
                  />
                </svg>
                {"\n            \n          "}
              </a>
              {"\n          "}
              <span
                className={
                  " p-1.5 top-15 rounded text-sm bg-zinc-700 absolute hidden group-hover:block "
                }
              >
                {"Projects"}
              </span>
              {"\n  \n        "}
            </li>
            {"\n        \n        "}
            <li
              className={
                "relative flex items-center justify-center transition-all group rounded-2xl hover:p-3 hover:bg-gradient-to-r from-yellow-300 to-cyan-400"
              }
            >
              {"\n          \n          "}
              <a className={"transition rounded-3xl"} href={"#contact"}>
                {"\n            "}
                <svg
                  width={"25px"}
                  height={"25px"}
                  viewBox={"0 0 16 16"}
                  version={"1.1"}
                  xmlns={"http://www.w3.org/2000/svg"}
                  xmlnsXlink={"http://www.w3.org/1999/xlink"}
                >
                  {"\n              "}
                  <path
                    fill={"#ffffff"}
                    d={
                      "M14.82 8c-0.309-0.851-0.969-1.511-1.799-1.813l-0.021-1.687c0-2.5-2.47-4.5-5.5-4.5s-5.5 2-5.5 4.5v1.68c-1.173 0.423-1.996 1.525-2 2.82v1c0 1.657 1.343 3 3 3h1v-7h-1v-1.5c0-1.93 2-3.5 4.5-3.5s4.5 1.57 4.5 3.5v1.5h-1v7h1c1.657 0 3-1.343 3-3v1.73c0 1.806-1.464 3.27-3.27 3.27h-1.73c0-0.552-0.448-1-1-1h-1c-0.552 0-1 0.448-1 1s0.448 1 1 1h3.73c2.358 0 4.27-1.912 4.27-4.27v-3.73h-1.18z"
                    }
                  />
                  {"\n            "}
                </svg>
                {"\n          "}
              </a>
              {"\n\n          "}
              <span
                className={
                  " p-1.5 top-15 rounded text-sm bg-zinc-700 absolute hidden  group-hover:block  "
                }
              >
                {"Contact"}
              </span>
              {"\n  \n        "}
            </li>
            {"\n\n\n      "}
          </ul>
          {"\n\n      \n      \n      "}
          <ul className={"flex items-center justify-normal"}>
            {"\n       \n          "}
            <a
              className={
                "relative flex flex-col items-center justify-center gap-1 p-3 transition-all rounded-2xl group-hover:block animate-pulse bg-zinc-200 group "
              }
              href={"#skills"}
            >
              {"\n            "}
              <svg
                width={"24px"}
                height={"24px"}
                viewBox={"0 -0.5 17 17"}
                version={"1.1"}
                xmlns={"http://www.w3.org/2000/svg"}
                xmlnsXlink={"http://www.w3.org/1999/xlink"}
                className={"si-glyph si-glyph-document"}
              >
                {
                  "\n    \n                  \n                  \n                  "
                }
                <defs>{"\n\n              "}</defs>
                {"\n                  "}
                <g
                  stroke={"none"}
                  strokeWidth={"1"}
                  fill={"none"}
                  fillRule={"evenodd"}
                >
                  {"\n                      "}
                  <g
                    transform={"translate(2.000000, 0.000000)"}
                    fill={"#434343"}
                  >
                    {"\n                          "}
                    <path
                      d={
                        "M0,0 L0,16 L13,16 L13,4.02441406 L7,4 L7,0.062 L0,0 Z M11,13 L2,13 L2,12 L11,12 L11,13 L11,13 Z M11,11 L2,11 L2,10 L11,10 L11,11 L11,11 Z M11,7 L11,8 L2,8 L2,7 L11,7 L11,7 Z"
                      }
                      className={"si-glyph-fill"}
                    >
                      {"\n\n              "}
                    </path>
                    {"\n                          "}
                    <path
                      d={"M8,0 L8,2.844 L12.752,2.844 L8,0 Z"}
                      className={"si-glyph-fill"}
                    >
                      {"\n\n              "}
                    </path>
                    {"\n                      "}
                  </g>
                  {"\n                  "}
                </g>
                {" \n            "}
              </svg>
              {"\n\n            "}
              <span
                className={
                  " p-1.5 rounded  text-sm bg-zinc-700 top-15 absolute hidden group-hover:block animate-none "
                }
              >
                {"Resume"}
              </span>
              {"\n\n          "}
            </a>
            {"\n          \n    \n      "}
          </ul>
          {"\n\n      \n\n      "}
          <ul className={"flex justify-center align-center "}>
            {"\n\n        "}
            <li
              className={
                "relative flex items-center justify-center p-2 transition-all group rounded-2xl hover:px-3 hover:bg-gradient-to-r from-yellow-300 to-cyan-400"
              }
            >
              {"\n          "}
              <a href={"http://x.com/skcodes__?s=21"}>
                {"\n            "}
                <svg
                  xmlns={"http://www.w3.org/2000/svg"}
                  x={"0px"}
                  y={"0px"}
                  width={"24"}
                  height={"25"}
                  viewBox={"0 0 50 50"}
                  stroke={"#ffffff"}
                  strokeWidth={"2"}
                  strokeLinecap={"round"}
                  strokeLinejoin={"round"}
                >
                  {"\n              "}
                  <path
                    d={
                      "M 5.9199219 6 L 20.582031 27.375 L 6.2304688 44 L 9.4101562 44 L 21.986328 29.421875 L 31.986328 44 L 44 44 L 28.681641 21.669922 L 42.199219 6 L 39.029297 6 L 27.275391 19.617188 L 17.933594 6 L 5.9199219 6 z M 9.7167969 8 L 16.880859 8 L 40.203125 42 L 33.039062 42 L 9.7167969 8 z"
                    }
                  />
                  {"\n            "}
                </svg>
                {"  \n          "}
              </a>
              {"\n          "}
              <span
                className={
                  " p-1.5 top-15 rounded text-sm bg-zinc-700 absolute hidden group-hover:block "
                }
              >
                {"Twitter"}
              </span>
              {"\n  \n        "}
            </li>
            {"\n\n        "}
            <li
              className={
                "relative flex items-center justify-center p-2 transition-all group rounded-2xl hover:px-3 hover:bg-gradient-to-r from-yellow-300 to-cyan-400"
              }
            >
              {"\n          "}
              <a
                href={
                  "https://www.linkedin.com/in/worlu-prince-796449376?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app "
                }
              >
                {"\n            "}
                <svg
                  xmlns={"http://www.w3.org/2000/svg"}
                  x={"0px"}
                  y={"0px"}
                  width={"25"}
                  height={"25"}
                  viewBox={"0 0 50 50"}
                  stroke={"#ffffff"}
                  strokeWidth={"2"}
                  {...{ "stroke-lincap": "round" }}
                  strokeLinejoin={"round"}
                >
                  {"\n              "}
                  <path
                    d={
                      "M 9 4 C 6.2504839 4 4 6.2504839 4 9 L 4 41 C 4 43.749516 6.2504839 46 9 46 L 41 46 C 43.749516 46 46 43.749516 46 41 L 46 9 C 46 6.2504839 43.749516 4 41 4 L 9 4 z M 9 6 L 41 6 C 42.668484 6 44 7.3315161 44 9 L 44 41 C 44 42.668484 42.668484 44 41 44 L 9 44 C 7.3315161 44 6 42.668484 6 41 L 6 9 C 6 7.3315161 7.3315161 6 9 6 z M 14 11.011719 C 12.904779 11.011719 11.919219 11.339079 11.189453 11.953125 C 10.459687 12.567171 10.011719 13.484511 10.011719 14.466797 C 10.011719 16.333977 11.631285 17.789609 13.691406 17.933594 A 0.98809878 0.98809878 0 0 0 13.695312 17.935547 A 0.98809878 0.98809878 0 0 0 14 17.988281 C 16.27301 17.988281 17.988281 16.396083 17.988281 14.466797 A 0.98809878 0.98809878 0 0 0 17.986328 14.414062 C 17.884577 12.513831 16.190443 11.011719 14 11.011719 z M 14 12.988281 C 15.392231 12.988281 15.94197 13.610038 16.001953 14.492188 C 15.989803 15.348434 15.460091 16.011719 14 16.011719 C 12.614594 16.011719 11.988281 15.302225 11.988281 14.466797 C 11.988281 14.049083 12.140703 13.734298 12.460938 13.464844 C 12.78117 13.19539 13.295221 12.988281 14 12.988281 z M 11 19 A 1.0001 1.0001 0 0 0 10 20 L 10 39 A 1.0001 1.0001 0 0 0 11 40 L 17 40 A 1.0001 1.0001 0 0 0 18 39 L 18 33.134766 L 18 20 A 1.0001 1.0001 0 0 0 17 19 L 11 19 z M 20 19 A 1.0001 1.0001 0 0 0 19 20 L 19 39 A 1.0001 1.0001 0 0 0 20 40 L 26 40 A 1.0001 1.0001 0 0 0 27 39 L 27 29 C 27 28.170333 27.226394 27.345035 27.625 26.804688 C 28.023606 26.264339 28.526466 25.940057 29.482422 25.957031 C 30.468166 25.973981 30.989999 26.311669 31.384766 26.841797 C 31.779532 27.371924 32 28.166667 32 29 L 32 39 A 1.0001 1.0001 0 0 0 33 40 L 39 40 A 1.0001 1.0001 0 0 0 40 39 L 40 28.261719 C 40 25.300181 39.122788 22.95433 37.619141 21.367188 C 36.115493 19.780044 34.024172 19 31.8125 19 C 29.710483 19 28.110853 19.704889 27 20.423828 L 27 20 A 1.0001 1.0001 0 0 0 26 19 L 20 19 z M 12 21 L 16 21 L 16 33.134766 L 16 38 L 12 38 L 12 21 z M 21 21 L 25 21 L 25 22.560547 A 1.0001 1.0001 0 0 0 26.798828 23.162109 C 26.798828 23.162109 28.369194 21 31.8125 21 C 33.565828 21 35.069366 21.582581 36.167969 22.742188 C 37.266572 23.901794 38 25.688257 38 28.261719 L 38 38 L 34 38 L 34 29 C 34 27.833333 33.720468 26.627107 32.990234 25.646484 C 32.260001 24.665862 31.031834 23.983076 29.517578 23.957031 C 27.995534 23.930001 26.747519 24.626988 26.015625 25.619141 C 25.283731 26.611293 25 27.829667 25 29 L 25 38 L 21 38 L 21 21 z"
                    }
                  />
                  {"\n            "}
                </svg>
                {"   \n          "}
              </a>
              {"\n          "}
              <span
                className={
                  " p-1.5 top-15 rounded text-sm bg-zinc-700 absolute hidden group-hover:block "
                }
              >
                {"LinkedIn"}
              </span>
              {"  \n  \n        "}
            </li>
            {"\n\n      "}
          </ul>
          {"\n    \n      \n\n    "}
        </nav>
        {"\n  "}
      </header>
      {"\n"}
    </>
  );
}
