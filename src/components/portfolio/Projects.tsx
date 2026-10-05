// Ported from the static HTML. Preserve classes and markup during migration.
import type { CSSProperties } from "react";
export default function Projects() {
  return (
    <>
      {"  "}
      <section
        className={
          "px-10 py-40 space-y-20 h-fit md:h-full md:py-30 md:px-16 lg:px-24"
        }
        id={"projects"}
      >
        {"\n    "}
        <div>
          <h1
            className={
              " text-center text-[27px] md:text-[40px] font-bold font-[Michroma]  text-cyan-400 mb-4"
            }
          >
            {" LATEST WORKS"}
          </h1>
        </div>
        {"\n    "}
        <div
          className={
            "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:space-y-50"
          }
        >
          {"\n\n      "}
          <div
            className={
              "relative grid gap-6 text-center rounded grid-col-1 border-1 md:text-left lg:translate-y-30"
            }
            data-aos={"fade-up"}
            data-aos-delay={"300"}
            id={"boxOne"}
          >
            {"\n  "}
            <img
              className={"w-full h-auto md:h-[100%] object-cover"}
              src={"/projectimgs/rdex.png"}
              alt={"RD Exchange — project screenshot (HTML, CSS, JavaScript)"}
            />
            {"\n       \n       "}
            <div
              className={
                "flex flex-col gap-5 p-3 pb-4 text-center md:text-left"
              }
            >
              {"\n\n        "}
              <h1 className={"text-[20px]  text-cyan-400   "}>
                {"Rd Exchange"}
              </h1>
              {"\n        "}
              <p>
                {
                  "While learning HTML, CSS, and JavaScript, I became obsessed with creating a fully functional website. Here, for a brother I built RDExchange  — a lightweight website that lets users submit crypto trade requests, which are sent directly to the trader via email. It was my way of combining what I was learning with solving a real-world problem."
                }
              </p>
              {"\n\n        "}
              <ul
                className={
                  " mt-5 text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-4 *:bg-gray-900 *:rounded-full *:w-8 *:h-8"
                }
                data-aos={"fade-out"}
                data-aos-duration={"80"}
              >
                {"\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-gray-400"
                  }
                >
                  {"\n            "}
                  <svg
                    className={""}
                    width={"24"}
                    height={"24"}
                    viewBox={"0 0 32 32"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    <title>{"HTML"}</title>
                    <polygon
                      points={
                        "5.902 27.201 3.655 2 28.345 2 26.095 27.197 15.985 30 5.902 27.201"
                      }
                      style={{ fill: "#e44f26" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 27.858 24.17 25.593 26.092 4.061 16 4.061 16 27.858"
                      }
                      style={{ fill: "#f1662a" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 13.407 11.91 13.407 11.628 10.242 16 10.242 16 7.151 15.989 7.151 8.25 7.151 8.324 7.981 9.083 16.498 16 16.498 16 13.407"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 21.434 15.986 21.438 12.544 20.509 12.324 18.044 10.651 18.044 9.221 18.044 9.654 22.896 15.986 24.654 16 24.65 16 21.434"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "15.989 13.407 15.989 16.498 19.795 16.498 19.437 20.507 15.989 21.437 15.989 24.653 22.326 22.896 22.372 22.374 23.098 14.237 23.174 13.407 22.341 13.407 15.989 13.407"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "15.989 7.151 15.989 9.071 15.989 10.235 15.989 10.242 23.445 10.242 23.445 10.242 23.455 10.242 23.517 9.548 23.658 7.981 23.732 7.151 15.989 7.151"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-amber-500"
                  }
                >
                  {"\n            "}
                  <svg
                    className={""}
                    width={"24"}
                    height={"24"}
                    viewBox={"0 0 32 32"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    <title>{"CSS"}</title>
                    <polygon
                      points={
                        "5.902 27.201 3.656 2 28.344 2 26.095 27.197 15.985 30 5.902 27.201"
                      }
                      style={{ fill: "#1572b6" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 27.858 24.17 25.593 26.092 4.061 16 4.061 16 27.858"
                      }
                      style={{ fill: "#33a9dc" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 13.191 20.09 13.191 20.372 10.026 16 10.026 16 6.935 16.011 6.935 23.75 6.935 23.676 7.764 22.917 16.282 16 16.282 16 13.191"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16.019 21.218 16.005 21.222 12.563 20.292 12.343 17.827 10.67 17.827 9.24 17.827 9.673 22.68 16.004 24.438 16.019 24.434 16.019 21.218"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "19.827 16.151 19.455 20.29 16.008 21.22 16.008 24.436 22.344 22.68 22.391 22.158 22.928 16.151 19.827 16.151"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16.011 6.935 16.011 8.855 16.011 10.018 16.011 10.026 8.555 10.026 8.555 10.026 8.545 10.026 8.483 9.331 8.342 7.764 8.268 6.935 16.011 6.935"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 13.191 16 15.111 16 16.274 16 16.282 12.611 16.282 12.611 16.282 12.601 16.282 12.539 15.587 12.399 14.02 12.325 13.191 16 13.191"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-gray-200 "
                  }
                >
                  {"\n            "}
                  <svg
                    className={""}
                    width={"19"}
                    height={"19"}
                    viewBox={"0 0 256 256"}
                    version={"1.1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    preserveAspectRatio={"xMidYMid"}
                  >
                    {"\n              "}
                    <title>{"JavaScript"}</title>
                    {"         \n                    "}
                    <g>
                      {"\n                        "}
                      <path
                        d={"M0,0 L256,0 L256,256 L0,256 L0,0 Z"}
                        fill={"#F7DF1E"}
                      />
                      {"\n                        "}
                      <path
                        d={
                          "M67.311746,213.932292 L86.902654,202.076241 C90.6821079,208.777346 94.1202286,214.447137 102.367086,214.447137 C110.272203,214.447137 115.256076,211.354819 115.256076,199.326883 L115.256076,117.528787 L139.313575,117.528787 L139.313575,199.666997 C139.313575,224.58433 124.707759,235.925943 103.3984,235.925943 C84.1532952,235.925943 72.9819429,225.958603 67.3113397,213.93026"
                        }
                        fill={"#000000"}
                      />
                      {"\n                        "}
                      <path
                        d={
                          "M152.380952,211.354413 L171.969422,200.0128 C177.125994,208.433981 183.827911,214.619835 195.684368,214.619835 C205.652521,214.619835 212.009041,209.635962 212.009041,202.762159 C212.009041,194.513676 205.479416,191.592025 194.481168,186.78207 L188.468419,184.202565 C171.111213,176.81473 159.597308,167.53534 159.597308,147.944838 C159.597308,129.901308 173.344508,116.153295 194.825752,116.153295 C210.119924,116.153295 221.117765,121.48094 229.021663,135.400432 L210.29059,147.428775 C206.166146,140.040127 201.699556,137.119289 194.826159,137.119289 C187.78047,137.119289 183.312254,141.587098 183.312254,147.428775 C183.312254,154.646349 187.78047,157.568406 198.089956,162.036622 L204.103924,164.614095 C224.553448,173.378641 236.067352,182.313448 236.067352,202.418387 C236.067352,224.071924 219.055137,235.927975 196.200432,235.927975 C173.860978,235.927975 159.425829,225.274311 152.381359,211.354413"
                        }
                        fill={"#000000"}
                      />
                      {"\n                    "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li className={"flex items-center justify-center border-2 "}>
                  {"\n            "}
                  <svg
                    fill={"#70e000"}
                    width={"24px"}
                    height={"24px"}
                    viewBox={"0 0 32 32"}
                    version={"1.1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    {"\n              "}
                    <title>{"googlesheets"}</title>
                    {"\n              "}
                    <path
                      d={
                        "M15.15 18.379h-4.247v2.38h4.25v-2.38zM22.797 12.601h-13.596v9.857h13.597v-9.858zM26.876 9.145v19.771c0 0 0 0 0 0.001 0 1.126-0.913 2.038-2.038 2.038-0 0-0.001 0-0.001 0h-17.675c0 0 0 0-0 0-1.126 0-2.039-0.913-2.039-2.039 0 0 0 0 0-0v0-25.833c0-0 0-0 0-0.001 0-1.126 0.913-2.038 2.038-2.038 0 0 0.001 0 0.001 0h11.613v8.101zM21.099 18.379h-4.25v2.38h4.25zM21.099 14.3h-4.25v2.38h4.25zM19.4 1.045v7.478h7.478zM15.15 16.679h-4.247v-2.379h4.25v2.38z"
                      }
                    />
                    {"\n            "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-green-400"
                  }
                >
                  {"\n            "}
                  <svg
                    width={"24"}
                    height={"24"}
                    viewBox={"0 0 86 68"}
                    fill={"none"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    {"\n              "}
                    <title>{"App Script "}</title>
                    {"\n              "}
                    <path
                      d={
                        "M10.255 47.7648C4.73 47.7648 0.25 52.2398 0.25 57.7548C0.25 63.2698 4.73 67.7448 10.255 67.7448H60.285V47.7598H10.255V47.7648Z"
                      }
                      fill={"#EA4335"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M10.255 62.7555C13.0192 62.7555 15.26 60.5191 15.26 57.7605C15.26 55.0018 13.0192 52.7655 10.255 52.7655C7.49081 52.7655 5.25 55.0018 5.25 57.7605C5.25 60.5191 7.49081 62.7555 10.255 62.7555Z"
                      }
                      fill={"white"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M25.69 20.3102C21.22 17.0652 14.96 18.0552 11.715 22.5202C8.465 26.9852 9.46 33.2352 13.93 36.4752L54.405 65.8402L66.17 49.6752L25.69 20.3102Z"
                      }
                      fill={"#FBBC04"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M19.8099 33.3903C22.5741 33.3903 24.8149 31.154 24.8149 28.3953C24.8149 25.6366 22.5741 23.4003 19.8099 23.4003C17.0458 23.4003 14.8049 25.6366 14.8049 28.3953C14.8049 31.154 17.0458 33.3903 19.8099 33.3903Z"
                      }
                      fill={"white"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M54.34 7.1549C52.63 1.9049 46.99 -0.965105 41.73 0.739896C36.475 2.4449 33.6 8.0849 35.305 13.3299L50.765 60.8399L69.795 54.6649L54.34 7.1549Z"
                      }
                      fill={"#34A853"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M44.82 15.24C47.5841 15.24 49.825 13.0037 49.825 10.245C49.825 7.48634 47.5841 5.25 44.82 5.25C42.0558 5.25 39.815 7.48634 39.815 10.245C39.815 13.0037 42.0558 15.24 44.82 15.24Z"
                      }
                      fill={"white"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M78.8351 0.739896C73.5801 -0.965104 67.9351 1.9049 66.2251 7.1549L50.7651 54.6649C49.0551 59.9149 51.9351 65.5499 57.1901 67.2549C62.4451 68.9599 68.0901 66.0899 69.8001 60.8399L85.2601 13.3299C86.9651 8.0849 84.0901 2.4449 78.8351 0.739896Z"
                      }
                      fill={"#4285F4"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M75.7403 15.24C78.5044 15.24 80.7453 13.0037 80.7453 10.245C80.7453 7.48634 78.5044 5.25 75.7403 5.25C72.9761 5.25 70.7353 7.48634 70.7353 10.245C70.7353 13.0037 72.9761 15.24 75.7403 15.24Z"
                      }
                      fill={"white"}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M60.2803 62.7498C63.0445 62.7498 65.2853 60.5135 65.2853 57.7548C65.2853 54.9962 63.0445 52.7598 60.2803 52.7598C57.5161 52.7598 55.2753 54.9962 55.2753 57.7548C55.2753 60.5135 57.5161 62.7498 60.2803 62.7498Z"
                      }
                      fill={"white"}
                    />
                    {"\n            "}
                  </svg>
                  {"\n\n          "}
                </li>
                {"\n\n        "}
              </ul>
              {"\n       \n        "}
              <div className={"flex items-center justify-center"}>
                {"\n          "}
                <a
                  className={
                    "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
                  }
                  href={"https://rdexchange.vercel.app/"}
                  target={"_blank"}
                  rel={"noopener noreferrer"}
                >
                  {"\n            "}
                  <svg
                    fill={"#000000"}
                    version={"1.1"}
                    id={"Layer_1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    width={"18px"}
                    height={"18px"}
                    viewBox={"0 0 70 70"}
                    enableBackground={"new 0 0 70 70"}
                    xmlSpace={"preserve"}
                  >
                    {"\n              "}
                    <g>
                      {"\n                "}
                      <path
                        d={
                          "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                        }
                      />
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n              "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n            "}
                  <p>{"VISIT"}</p>
                  {"\n          "}
                </a>
                {"\n        "}
              </div>
              {"\n\n       "}
            </div>
            {"\n\n\n\n      "}
          </div>
          {"\n\n      "}
          <div
            className={
              "grid grid-cols-1 gap-6 text-center rounded border-1 border-cyan-400 md:text-left "
            }
            data-aos={"fade-up"}
            id={"boxTwo"}
          >
            {"\n      \n  "}
            <img
              className={"w-full h-auto md:h-[80%] object-cover"}
              src={"/myport.png"}
              alt={
                "Personal portfolio project screenshot — built with Tailwind CSS and JavaScript"
              }
            />
            {"\n\n       "}
            <div className={"flex flex-col gap-6 p-3 "}>
              {"\n        \n        "}
              <h1 className={"text-[20px] uppercase text-cyan-400 "}>
                {"My Portfolio"}
              </h1>
              {"\n        "}
              <p className={""}>
                {
                  "My portfolio, proudly built with Tailwind CSS. This was my very first Tailwind project, and it completely reshaped my preference for it over Bootstrap"
                }
              </p>
              {"\n        \n        "}
              <ul
                className={
                  " text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-4 *:bg-gray-900 *:rounded-full *:w-8 *:h-8"
                }
              >
                {"\n          \n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-amber-500"
                  }
                  data-aos={"fade-out"}
                  data-aos-delay={"80"}
                >
                  {"\n            "}
                  <svg
                    width={"25px"}
                    height={"25px"}
                    viewBox={"0 0 32 32"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    <title>{"Tailwind CSS"}</title>
                    <path
                      d={
                        "M9,13.7q1.4-5.6,7-5.6c5.6,0,6.3,4.2,9.1,4.9q2.8.7,4.9-2.1-1.4,5.6-7,5.6c-5.6,0-6.3-4.2-9.1-4.9Q11.1,10.9,9,13.7ZM2,22.1q1.4-5.6,7-5.6c5.6,0,6.3,4.2,9.1,4.9q2.8.7,4.9-2.1-1.4,5.6-7,5.6c-5.6,0-6.3-4.2-9.1-4.9Q4.1,19.3,2,22.1Z"
                      }
                      style={{ fill: "#44a8b3" } as CSSProperties}
                    />
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-gray-200 "
                  }
                  data-aos={"fade-out"}
                  data-aos-delay={"110"}
                >
                  {"\n            "}
                  <svg
                    className={""}
                    width={"19"}
                    height={"19"}
                    viewBox={"0 0 256 256"}
                    version={"1.1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    preserveAspectRatio={"xMidYMid"}
                  >
                    {"\n              "}
                    <title>{"JavaScript"}</title>
                    {"\n                    "}
                    <g>
                      {"\n                        "}
                      <path
                        d={"M0,0 L256,0 L256,256 L0,256 L0,0 Z"}
                        fill={"#F7DF1E"}
                      />
                      {"\n                        "}
                      <path
                        d={
                          "M67.311746,213.932292 L86.902654,202.076241 C90.6821079,208.777346 94.1202286,214.447137 102.367086,214.447137 C110.272203,214.447137 115.256076,211.354819 115.256076,199.326883 L115.256076,117.528787 L139.313575,117.528787 L139.313575,199.666997 C139.313575,224.58433 124.707759,235.925943 103.3984,235.925943 C84.1532952,235.925943 72.9819429,225.958603 67.3113397,213.93026"
                        }
                        fill={"#000000"}
                      />
                      {"\n                        "}
                      <path
                        d={
                          "M152.380952,211.354413 L171.969422,200.0128 C177.125994,208.433981 183.827911,214.619835 195.684368,214.619835 C205.652521,214.619835 212.009041,209.635962 212.009041,202.762159 C212.009041,194.513676 205.479416,191.592025 194.481168,186.78207 L188.468419,184.202565 C171.111213,176.81473 159.597308,167.53534 159.597308,147.944838 C159.597308,129.901308 173.344508,116.153295 194.825752,116.153295 C210.119924,116.153295 221.117765,121.48094 229.021663,135.400432 L210.29059,147.428775 C206.166146,140.040127 201.699556,137.119289 194.826159,137.119289 C187.78047,137.119289 183.312254,141.587098 183.312254,147.428775 C183.312254,154.646349 187.78047,157.568406 198.089956,162.036622 L204.103924,164.614095 C224.553448,173.378641 236.067352,182.313448 236.067352,202.418387 C236.067352,224.071924 219.055137,235.927975 196.200432,235.927975 C173.860978,235.927975 159.425829,225.274311 152.381359,211.354413"
                        }
                        fill={"#000000"}
                      />
                      {"\n                    "}
                    </g>
                    {"\n              "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n\n\n        "}
              </ul>
              {"\n       \n        "}
              <div className={"flex items-center justify-center"}>
                {"\n          "}
                <a
                  className={
                    "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
                  }
                >
                  {"\n            "}
                  <svg
                    fill={"#000000"}
                    version={"1.1"}
                    id={"Layer_1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    width={"18px"}
                    height={"18px"}
                    viewBox={"0 0 70 70"}
                    enableBackground={"new 0 0 70 70"}
                    xmlSpace={"preserve"}
                  >
                    {"\n              "}
                    <g>
                      {"\n                "}
                      <path
                        d={
                          "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                        }
                      />
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n              "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n            "}
                  <p>{"VISIT"}</p>
                  {"\n          "}
                </a>
                {"\n        "}
              </div>
              {"\n\n       "}
            </div>
            {"\n      \n\n      "}
          </div>
          {"\n\n      "}
          <div
            className={
              "grid grid-cols-1 gap-6 text-center rounded border-1 border-cyan-400 md:text-left lg:translate-y-30"
            }
            data-aos={"fade-up"}
            data-aos-delay={"md:400"}
            id={"boxThree"}
          >
            {"\n      \n  "}
            <img
              className={"w-full h-auto md:h-[100%] object-cover"}
              src={"/projectimgs/face attendance system.png"}
              alt={
                "Face Attendance System — project screenshot (face recognition, Node.js, Google Sheets)"
              }
            />
            {"\n\n       "}
            <div className={"flex flex-col gap-6 p-3 pb-4 "}>
              {"\n        \n        "}
              <h1 className={"text-[20px]  uppercase text-cyan-400 "}>
                {"A Three-Module Face Attendance System"}
              </h1>
              {"\n        "}
              <p className={""}>
                {
                  "Unlike traditional smart attendance solutions, this system is built as a unique three-app module: a student registration portal, a lecturer portal, and a student verification page. Together, they deliver secure, automated, and tamper-proof attendance marking — powered by face recognition, tokenized class links, WiFi/IP restrictions, and real-time Google Sheets integration."
                }
              </p>
              {"\n        \n        "}
              <ul
                className={
                  " text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-4 *:bg-gray-900 *:rounded-full"
                }
              >
                {"\n          "}
                <li>
                  {"\n            "}
                  <svg
                    xmlns={"http://www.w3.org/2000/svg"}
                    x={"0px"}
                    y={"0px"}
                    width={"25"}
                    height={"25"}
                    viewBox={"0 0 48 48"}
                    className={"bg-white rounded-full"}
                  >
                    {"\n              "}
                    <title>{"Express Js"}</title>
                    {"\n               "}
                    <path
                      fill={"#212121"}
                      d={
                        "M23.697,37.56h1.18c0.84,0,1.631-0.392,2.139-1.061l7.485-9.847l7.485,9.847\tc0.508,0.668,1.299,1.061,2.139,1.061h1.18L35.756,25l9.121-12h-1.18c-0.84,0-1.631,0.392-2.139,1.061L34.5,23.347l-7.059-9.287\tC26.933,13.392,26.142,13,25.302,13h-1.18l9.121,12L23.697,37.56z"
                      }
                    />
                    <path
                      fill={"#212121"}
                      d={
                        "M24,26v-3c0-6.675-5.945-11.961-12.829-10.852C5.812,13.011,2,17.857,2,23.284L2,24v2v0.142\tc0,6.553,4.777,11.786,10.868,11.858c5.092,0.06,9.389-3.344,10.707-7.999h-1.028c-0.62,0-1.182,0.355-1.451,0.913\tc-1.739,3.595-5.789,5.862-10.228,4.842C6.776,34.815,4,30.981,4,26.783V26H24z M4,23.71c0-4.708,2.804-8.557,6.924-9.478\tC16.798,12.92,22,17.352,22,23v1H4V23.71z"
                      }
                    />
                    {"\n            "}
                  </svg>
                  {"\n          \n          "}
                </li>
                {"\n\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-gray-400"
                  }
                >
                  {"\n            "}
                  <svg
                    className={""}
                    width={"25"}
                    height={"25"}
                    viewBox={"0 0 32 32"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    <title>{"HTML"}</title>
                    <polygon
                      points={
                        "5.902 27.201 3.655 2 28.345 2 26.095 27.197 15.985 30 5.902 27.201"
                      }
                      style={{ fill: "#e44f26" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 27.858 24.17 25.593 26.092 4.061 16 4.061 16 27.858"
                      }
                      style={{ fill: "#f1662a" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 13.407 11.91 13.407 11.628 10.242 16 10.242 16 7.151 15.989 7.151 8.25 7.151 8.324 7.981 9.083 16.498 16 16.498 16 13.407"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 21.434 15.986 21.438 12.544 20.509 12.324 18.044 10.651 18.044 9.221 18.044 9.654 22.896 15.986 24.654 16 24.65 16 21.434"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "15.989 13.407 15.989 16.498 19.795 16.498 19.437 20.507 15.989 21.437 15.989 24.653 22.326 22.896 22.372 22.374 23.098 14.237 23.174 13.407 22.341 13.407 15.989 13.407"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "15.989 7.151 15.989 9.071 15.989 10.235 15.989 10.242 23.445 10.242 23.445 10.242 23.455 10.242 23.517 9.548 23.658 7.981 23.732 7.151 15.989 7.151"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-amber-500"
                  }
                >
                  {"\n            "}
                  <svg
                    className={""}
                    width={"25"}
                    height={"25"}
                    viewBox={"0 0 32 32"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    <title>{"CSS"}</title>
                    <polygon
                      points={
                        "5.902 27.201 3.656 2 28.344 2 26.095 27.197 15.985 30 5.902 27.201"
                      }
                      style={{ fill: "#1572b6" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 27.858 24.17 25.593 26.092 4.061 16 4.061 16 27.858"
                      }
                      style={{ fill: "#33a9dc" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 13.191 20.09 13.191 20.372 10.026 16 10.026 16 6.935 16.011 6.935 23.75 6.935 23.676 7.764 22.917 16.282 16 16.282 16 13.191"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16.019 21.218 16.005 21.222 12.563 20.292 12.343 17.827 10.67 17.827 9.24 17.827 9.673 22.68 16.004 24.438 16.019 24.434 16.019 21.218"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "19.827 16.151 19.455 20.29 16.008 21.22 16.008 24.436 22.344 22.68 22.391 22.158 22.928 16.151 19.827 16.151"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16.011 6.935 16.011 8.855 16.011 10.018 16.011 10.026 8.555 10.026 8.555 10.026 8.545 10.026 8.483 9.331 8.342 7.764 8.268 6.935 16.011 6.935"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                    <polygon
                      points={
                        "16 13.191 16 15.111 16 16.274 16 16.282 12.611 16.282 12.611 16.282 12.601 16.282 12.539 15.587 12.399 14.02 12.325 13.191 16 13.191"
                      }
                      style={{ fill: "#ebebeb" } as CSSProperties}
                    />
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li
                  className={
                    "flex items-center justify-center border-2 border-gray-200 p-1 "
                  }
                >
                  {"\n            "}
                  <svg
                    className={""}
                    width={"19"}
                    height={"21"}
                    viewBox={"0 0 256 256"}
                    version={"1.1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    preserveAspectRatio={"xMidYMid"}
                  >
                    {"\n              "}
                    <title>{"JavaScript"}</title>
                    {"         \n                    "}
                    <g>
                      {"\n                        "}
                      <path
                        d={"M0,0 L256,0 L256,256 L0,256 L0,0 Z"}
                        fill={"#F7DF1E"}
                      />
                      {"\n                        "}
                      <path
                        d={
                          "M67.311746,213.932292 L86.902654,202.076241 C90.6821079,208.777346 94.1202286,214.447137 102.367086,214.447137 C110.272203,214.447137 115.256076,211.354819 115.256076,199.326883 L115.256076,117.528787 L139.313575,117.528787 L139.313575,199.666997 C139.313575,224.58433 124.707759,235.925943 103.3984,235.925943 C84.1532952,235.925943 72.9819429,225.958603 67.3113397,213.93026"
                        }
                        fill={"#000000"}
                      />
                      {"\n                        "}
                      <path
                        d={
                          "M152.380952,211.354413 L171.969422,200.0128 C177.125994,208.433981 183.827911,214.619835 195.684368,214.619835 C205.652521,214.619835 212.009041,209.635962 212.009041,202.762159 C212.009041,194.513676 205.479416,191.592025 194.481168,186.78207 L188.468419,184.202565 C171.111213,176.81473 159.597308,167.53534 159.597308,147.944838 C159.597308,129.901308 173.344508,116.153295 194.825752,116.153295 C210.119924,116.153295 221.117765,121.48094 229.021663,135.400432 L210.29059,147.428775 C206.166146,140.040127 201.699556,137.119289 194.826159,137.119289 C187.78047,137.119289 183.312254,141.587098 183.312254,147.428775 C183.312254,154.646349 187.78047,157.568406 198.089956,162.036622 L204.103924,164.614095 C224.553448,173.378641 236.067352,182.313448 236.067352,202.418387 C236.067352,224.071924 219.055137,235.927975 196.200432,235.927975 C173.860978,235.927975 159.425829,225.274311 152.381359,211.354413"
                        }
                        fill={"#000000"}
                      />
                      {"\n                    "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n        \n\n          "}
                <li>
                  {"\n            "}
                  <svg
                    width={"24px"}
                    height={"24px"}
                    viewBox={"-16.5 0 289 289"}
                    version={"1.1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    preserveAspectRatio={"xMidYMid"}
                  >
                    {"\n                "}
                    <title>{"Node Js"}</title>
                    {"\n                "}
                    <g>
                      {"\n                    "}
                      <path
                        d={
                          "M127.999999,288.463771 C124.024844,288.463771 120.314699,287.403728 116.869564,285.548656 L81.6231884,264.612838 C76.32298,261.697724 78.9730854,260.637682 80.5631458,260.107661 C87.7184259,257.72257 89.0434775,257.192547 96.4637688,252.952381 C97.2587979,252.422361 98.3188405,252.687372 99.1138718,253.217392 L126.144927,269.383024 C127.20497,269.913045 128.530021,269.913045 129.325053,269.383024 L235.064182,208.165634 C236.124225,207.635611 236.654245,206.575571 236.654245,205.250519 L236.654245,83.0807467 C236.654245,81.7556929 236.124225,80.6956526 235.064182,80.1656324 L129.325053,19.2132506 C128.26501,18.6832305 126.939959,18.6832305 126.144927,19.2132506 L20.4057954,80.1656324 C19.3457551,80.6956526 18.8157349,82.0207041 18.8157349,83.0807467 L18.8157349,205.250519 C18.8157349,206.31056 19.3457551,207.635611 20.4057954,208.165634 L49.2919247,224.861286 C64.9275364,232.811595 74.7329196,223.536234 74.7329196,214.260871 L74.7329196,93.681159 C74.7329196,92.0910985 76.0579711,90.5010358 77.9130428,90.5010358 L91.4285716,90.5010358 C93.0186343,90.5010358 94.6086948,91.8260873 94.6086948,93.681159 L94.6086948,214.260871 C94.6086948,235.196689 83.2132512,247.387164 63.3374737,247.387164 C57.2422362,247.387164 52.4720502,247.387164 38.9565214,240.761906 L11.1304347,224.861286 C4.24016581,220.886129 5.68434189e-14,213.46584 5.68434189e-14,205.515528 L5.68434189e-14,83.3457557 C5.68434189e-14,75.3954465 4.24016581,67.9751552 11.1304347,64.0000006 L116.869564,2.78260752 C123.494824,-0.927535841 132.505176,-0.927535841 139.130436,2.78260752 L244.869565,64.0000006 C251.759834,67.9751552 256,75.3954465 256,83.3457557 L256,205.515528 C256,213.46584 251.759834,220.886129 244.869565,224.861286 L139.130436,286.078676 C135.685299,287.668739 131.710145,288.463771 127.999999,288.463771 L127.999999,288.463771 Z M160.596274,204.455488 C114.219461,204.455488 104.679089,183.254659 104.679089,165.233955 C104.679089,163.643893 106.004141,162.053832 107.859212,162.053832 L121.639752,162.053832 C123.229813,162.053832 124.554864,163.113872 124.554864,164.703935 C126.674947,178.749484 132.770187,185.639753 160.861283,185.639753 C183.122154,185.639753 192.662526,180.604556 192.662526,168.67909 C192.662526,161.788821 190.012423,156.753624 155.296065,153.308489 C126.409938,150.393375 108.389235,144.033126 108.389235,120.977226 C108.389235,99.5113875 126.409938,86.7908901 156.621119,86.7908901 C190.542443,86.7908901 207.238095,98.4513472 209.358178,123.89234 C209.358178,124.687371 209.093167,125.482403 208.563147,126.277434 C208.033127,126.807454 207.238095,127.337474 206.443064,127.337474 L192.662526,127.337474 C191.337475,127.337474 190.012423,126.277434 189.747412,124.952382 C186.567289,110.376813 178.351966,105.606625 156.621119,105.606625 C132.240165,105.606625 129.325053,114.086957 129.325053,120.447205 C129.325053,128.132506 132.770187,130.5176 165.631471,134.757766 C198.227744,138.997931 213.598344,145.093169 213.598344,167.884058 C213.333333,191.20497 194.252589,204.455488 160.596274,204.455488 L160.596274,204.455488 Z"
                        }
                        fill={"#539E43"}
                      />
                      {"\n                "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          \n        "}
              </ul>
              {"\n       \n        "}
              <div className={"flex items-center justify-center"}>
                {"\n          "}
                <a
                  className={
                    "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
                  }
                  href={"/overview.html"}
                >
                  {"\n            "}
                  <svg
                    fill={"#000000"}
                    version={"1.1"}
                    id={"Layer_1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    width={"18px"}
                    height={"18px"}
                    viewBox={"0 0 70 70"}
                    enableBackground={"new 0 0 70 70"}
                    xmlSpace={"preserve"}
                  >
                    {"\n              "}
                    <g>
                      {"\n                "}
                      <path
                        d={
                          "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                        }
                      />
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n              "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n            "}
                  <p>{"VISIT"}</p>
                  {"\n          "}
                </a>
                {"\n        "}
              </div>
              {"\n\n       "}
            </div>
            {"\n      \n      \n\n      \n\n      "}
          </div>
          {"\n\n\n      "}
          <div className={"md:hidden lg:block"} />
          {"\n      \n      "}
          <div
            className={
              "grid gap-6  rounded grid-col-1 border-1 md:text-left lg:-translate-y-20"
            }
            data-aos={"fade-up"}
            id={"boxFour"}
          >
            {"\n  "}
            <img
              className={"h-auto  "}
              src={"/projectimgs/ncuts.png"}
              alt={"NCUTS project screenshot — UI preview"}
            />
            {"\n       \n       "}
            <div
              className={
                "flex flex-col gap-5 p-3 pb-4 text-center md:text-left text-center"
              }
            >
              {"\n\n        "}
              <h1 className={"text-[20px]  text-cyan-400  "}>
                {"Native Cuts"}
              </h1>
              {"\n        "}
              <p className={"text-center text-base"}>
                {
                  "A Full Stack saloon booking website built for the Native Cuts brand"
                }
              </p>
              {"\n        "}
              <p className={" text-base text-left text-yellow-400"}>
                {"Core Feautures"}
              </p>
              {"\n        "}
              <ul className={"list-disc list-inside text-left"}>
                {"\n          "}
                <li>{"CRUD enabled"}</li>
                {"\n          "}
                <li>
                  {"Ai integration for booking and hairstyle suggestions"}
                </li>
                {"\n          "}
                <li>{"Admin Dashboard"}</li>
                {"\n          "}
                <li>{"User Authentication"}</li>
                {"\n          "}
                <li>{"User Management"}</li>
                {"\n          "}
                <li>{"Notification System"}</li>
                {"\n          "}
                <li>{"Analytics"}</li>
                {"\n          "}
                <li>{"SEO Optimized"}</li>
                {"\n          "}
                <li>{"Responsive Design"}</li>
                {"\n        "}
              </ul>
              {"\n\n        "}
              <ul
                className={
                  " text-sm font-semibold text-cyan-600 flex  gap-4  items-center justify-center border-gray-400 border-t-2  relative *:relative *:-top-3 *:bg-gray-900 *:rounded-full"
                }
              >
                {"\n          "}
                <li className={""}>
                  {"\n            "}
                  <svg
                    width={"24px"}
                    height={"24px"}
                    viewBox={"0 0 15 15"}
                    fill={"none"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    {"\n             "}
                    <path
                      d={
                        "M4.5 4.5L4.90534 4.20725C4.77836 4.03144 4.55252 3.95753 4.34617 4.02425C4.13981 4.09098 4 4.28313 4 4.5H4.5ZM7.5 14C3.91015 14 1 11.0899 1 7.5H0C0 11.6421 3.35786 15 7.5 15V14ZM14 7.5C14 11.0899 11.0899 14 7.5 14V15C11.6421 15 15 11.6421 15 7.5H14ZM7.5 1C11.0899 1 14 3.91015 14 7.5H15C15 3.35786 11.6421 0 7.5 0V1ZM7.5 0C3.35786 0 0 3.35786 0 7.5H1C1 3.91015 3.91015 1 7.5 1V0ZM5 12V4.5H4V12H5ZM4.09466 4.79275L10.5947 13.7927L11.4053 13.2073L4.90534 4.20725L4.09466 4.79275ZM10 4V10H11V4H10Z"
                      }
                      fill={"#ffffff"}
                    />
                    {"\n            "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li>
                  {"\n            "}
                  <svg
                    className={"border-2 rounded-full border-amber-500"}
                    width={"25px"}
                    height={"25px"}
                    viewBox={"0 0 32 32"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    <title>{"file_type_tailwind"}</title>
                    <path
                      d={
                        "M9,13.7q1.4-5.6,7-5.6c5.6,0,6.3,4.2,9.1,4.9q2.8.7,4.9-2.1-1.4,5.6-7,5.6c-5.6,0-6.3-4.2-9.1-4.9Q11.1,10.9,9,13.7ZM2,22.1q1.4-5.6,7-5.6c5.6,0,6.3,4.2,9.1,4.9q2.8.7,4.9-2.1-1.4,5.6-7,5.6c-5.6,0-6.3-4.2-9.1-4.9Q4.1,19.3,2,22.1Z"
                      }
                      style={{ fill: "#44a8b3" } as CSSProperties}
                    />
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li>
                  {"\n            "}
                  <svg
                    width={"24px"}
                    height={"24px"}
                    viewBox={"-16.5 0 289 289"}
                    version={"1.1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    preserveAspectRatio={"xMidYMid"}
                  >
                    {"\n                "}
                    <g>
                      {"\n                    "}
                      <path
                        d={
                          "M127.999999,288.463771 C124.024844,288.463771 120.314699,287.403728 116.869564,285.548656 L81.6231884,264.612838 C76.32298,261.697724 78.9730854,260.637682 80.5631458,260.107661 C87.7184259,257.72257 89.0434775,257.192547 96.4637688,252.952381 C97.2587979,252.422361 98.3188405,252.687372 99.1138718,253.217392 L126.144927,269.383024 C127.20497,269.913045 128.530021,269.913045 129.325053,269.383024 L235.064182,208.165634 C236.124225,207.635611 236.654245,206.575571 236.654245,205.250519 L236.654245,83.0807467 C236.654245,81.7556929 236.124225,80.6956526 235.064182,80.1656324 L129.325053,19.2132506 C128.26501,18.6832305 126.939959,18.6832305 126.144927,19.2132506 L20.4057954,80.1656324 C19.3457551,80.6956526 18.8157349,82.0207041 18.8157349,83.0807467 L18.8157349,205.250519 C18.8157349,206.31056 19.3457551,207.635611 20.4057954,208.165634 L49.2919247,224.861286 C64.9275364,232.811595 74.7329196,223.536234 74.7329196,214.260871 L74.7329196,93.681159 C74.7329196,92.0910985 76.0579711,90.5010358 77.9130428,90.5010358 L91.4285716,90.5010358 C93.0186343,90.5010358 94.6086948,91.8260873 94.6086948,93.681159 L94.6086948,214.260871 C94.6086948,235.196689 83.2132512,247.387164 63.3374737,247.387164 C57.2422362,247.387164 52.4720502,247.387164 38.9565214,240.761906 L11.1304347,224.861286 C4.24016581,220.886129 5.68434189e-14,213.46584 5.68434189e-14,205.515528 L5.68434189e-14,83.3457557 C5.68434189e-14,75.3954465 4.24016581,67.9751552 11.1304347,64.0000006 L116.869564,2.78260752 C123.494824,-0.927535841 132.505176,-0.927535841 139.130436,2.78260752 L244.869565,64.0000006 C251.759834,67.9751552 256,75.3954465 256,83.3457557 L256,205.515528 C256,213.46584 251.759834,220.886129 244.869565,224.861286 L139.130436,286.078676 C135.685299,287.668739 131.710145,288.463771 127.999999,288.463771 L127.999999,288.463771 Z M160.596274,204.455488 C114.219461,204.455488 104.679089,183.254659 104.679089,165.233955 C104.679089,163.643893 106.004141,162.053832 107.859212,162.053832 L121.639752,162.053832 C123.229813,162.053832 124.554864,163.113872 124.554864,164.703935 C126.674947,178.749484 132.770187,185.639753 160.861283,185.639753 C183.122154,185.639753 192.662526,180.604556 192.662526,168.67909 C192.662526,161.788821 190.012423,156.753624 155.296065,153.308489 C126.409938,150.393375 108.389235,144.033126 108.389235,120.977226 C108.389235,99.5113875 126.409938,86.7908901 156.621119,86.7908901 C190.542443,86.7908901 207.238095,98.4513472 209.358178,123.89234 C209.358178,124.687371 209.093167,125.482403 208.563147,126.277434 C208.033127,126.807454 207.238095,127.337474 206.443064,127.337474 L192.662526,127.337474 C191.337475,127.337474 190.012423,126.277434 189.747412,124.952382 C186.567289,110.376813 178.351966,105.606625 156.621119,105.606625 C132.240165,105.606625 129.325053,114.086957 129.325053,120.447205 C129.325053,128.132506 132.770187,130.5176 165.631471,134.757766 C198.227744,138.997931 213.598344,145.093169 213.598344,167.884058 C213.333333,191.20497 194.252589,204.455488 160.596274,204.455488 L160.596274,204.455488 Z"
                        }
                        fill={"#539E43"}
                      />
                      {"\n                "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n          "}
                <li>
                  {"\n            "}
                  <svg
                    className={"border rounded-full "}
                    width={"24px"}
                    height={"24x"}
                    viewBox={"0 0 1024 1024"}
                    xmlns={"http://www.w3.org/2000/svg"}
                  >
                    {"\n              "}
                    <circle
                      cx={"512"}
                      cy={"512"}
                      r={"512"}
                      style={{ fill: "#13aa52" } as CSSProperties}
                    />
                    {"\n              "}
                    <path
                      d={
                        "M648.86 449.44c-32.34-142.73-108.77-189.66-117-207.59-9-12.65-18.12-35.15-18.12-35.15-.15-.38-.39-1.05-.67-1.7-.93 12.65-1.41 17.53-13.37 30.29-18.52 14.48-113.54 94.21-121.27 256.37-7.21 151.24 109.25 241.36 125 252.85l1.79 1.27v-.11c.1.76 5 36 8.44 73.34H526a726.68 726.68 0 0 1 13-78.53l1-.65a204.48 204.48 0 0 0 20.11-16.45l.72-.65c33.48-30.93 93.67-102.47 93.08-216.53a347.07 347.07 0 0 0-5.05-56.76zM512.35 659.12s0-212.12 7-212.08c5.46 0 12.53 273.61 12.53 273.61-9.72-1.17-19.53-45.03-19.53-61.53z"
                      }
                      style={{ fill: "#fff" } as CSSProperties}
                    />
                    {"\n            "}
                  </svg>
                  {"\n          "}
                </li>
                {"\n\n        "}
              </ul>
              {"\n       \n        "}
              <div className={"flex items-center justify-center"}>
                {"\n          "}
                <a
                  className={
                    "inline-flex gap-2 px-6 py-4 font-mono text-gray-900 transition bg-gray-200 border-2 border-double rounded-3xl hover:bg-blue-200 hover:text-gray-800 hover:border-blue-950"
                  }
                  href={"https://nativecuts.vercel.app/"}
                >
                  {"\n            "}
                  <svg
                    fill={"#000000"}
                    version={"1.1"}
                    id={"Layer_1"}
                    xmlns={"http://www.w3.org/2000/svg"}
                    xmlnsXlink={"http://www.w3.org/1999/xlink"}
                    width={"18px"}
                    height={"18px"}
                    viewBox={"0 0 70 70"}
                    enableBackground={"new 0 0 70 70"}
                    xmlSpace={"preserve"}
                  >
                    {"\n              "}
                    <g>
                      {"\n                "}
                      <path
                        d={
                          "M63.042,7.269L49.18,59.007L34.279,44.105L15.652,62.731L6.958,54.04l18.627-18.627l-14.28-14.281L63.042,7.269\n                  M63.042,3.269c-0.346,0-0.693,0.045-1.035,0.137L10.271,17.269c-1.38,0.369-2.458,1.447-2.829,2.828\n                  c-0.37,1.38,0.025,2.853,1.035,3.863l11.452,11.453L4.13,51.212c-0.75,0.75-1.172,1.768-1.172,2.828\n                  c0,1.062,0.421,2.078,1.172,2.829l8.693,8.691c0.781,0.78,1.805,1.171,2.828,1.171c1.024,0,2.047-0.391,2.828-1.172l15.799-15.797\n                  l12.073,12.072c0.76,0.76,1.781,1.172,2.828,1.172c0.346,0,0.693-0.045,1.035-0.137c1.381-0.369,2.459-1.447,2.828-2.828\n                  L66.905,8.304c0.37-1.381-0.024-2.854-1.035-3.863C65.11,3.681,64.089,3.269,63.042,3.269L63.042,3.269z"
                        }
                      />
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M42.435,18.491c-0.438,0-0.839-0.288-0.963-0.729c-0.149-0.532,0.16-1.084,0.692-1.233l2.788-0.783\n                    c0.533-0.147,1.084,0.16,1.233,0.692s-0.161,1.084-0.692,1.233l-2.788,0.783C42.614,18.479,42.523,18.491,42.435,18.491z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n                "}
                      <g>
                        {"\n                  "}
                        <path
                          d={
                            "M20.618,24.616c-0.437,0-0.838-0.288-0.962-0.729c-0.149-0.532,0.161-1.084,0.693-1.233l16.143-4.531\n                    c0.531-0.15,1.084,0.16,1.232,0.692c0.149,0.532-0.16,1.084-0.692,1.233l-16.143,4.531C20.798,24.604,20.707,24.616,20.618,24.616\n                    z"
                          }
                        />
                        {"\n                "}
                      </g>
                      {"\n              "}
                    </g>
                    {"\n            "}
                  </svg>
                  {"\n            "}
                  <p>{"VISIT"}</p>
                  {"\n          "}
                </a>
                {"\n        "}
              </div>
              {"\n\n       "}
            </div>
            {"\n\n      "}
          </div>
          {"\n      \n\n    "}
        </div>
        {"\n\n    \n\n    \n  "}
      </section>
      {"\n"}
    </>
  );
}
