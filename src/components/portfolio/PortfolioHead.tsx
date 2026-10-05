// Ported from the static HTML. Preserve classes and markup during migration.
export default function PortfolioHead() {
  return (
    <>
      <meta charSet={"UTF-8"} />
      <meta name={"viewport"} content={"width=device-width, initial-scale=1"} />
      <title>
        {
          "Worlu Prince — Full Stack Web And Ai Developer | JavaScript, React, PHP, Python & Tailwind CSS"
        }
      </title>
      <meta
        name={"description"}
        content={
          "Worlu Prince — Junior Front-end Developer specializing in HTML, CSS, JavaScript, React and Tailwind CSS. Portfolio with responsive UI projects, AI automation demos and open-to-hire front-end roles (remote or on-site)."
        }
      />
      <meta
        name={"keywords"}
        content={
          "Front-end Developer, JavaScript, React, Tailwind CSS, UI Developer, Frontend portfolio, Junior Front-end, Web Developer, UI/UX"
        }
      />
      <link rel={"canonical"} href={"https://yourdomain.example/"} />
      <meta name={"robots"} content={"index, follow"} />
      <meta
        name={"google-site-verification"}
        content={"7gxKwCTLH_hlXGaEv75l3dCWPY-Iga03xhsx_OaDfL8"}
      />
      <meta property={"og:type"} content={"website"} />
      <meta
        property={"og:title"}
        content={"Worlu Prince — Junior Front-end Developer | Portfolio"}
      />
      <meta
        property={"og:description"}
        content={
          "Portfolio of Worlu Prince — Front-end developer skilled in JavaScript, React, Tailwind CSS. View projects, skills and contact for front-end roles."
        }
      />
      <meta
        property={"og:image"}
        content={"https://yourdomain.example/mypictop.jpg"}
      />
      <meta property={"og:url"} content={"https://yourdomain.example/"} />
      <meta name={"twitter:card"} content={"summary_large_image"} />
      <meta
        name={"twitter:title"}
        content={"Worlu Prince — Front-end Developer"}
      />
      <meta
        name={"twitter:description"}
        content={
          "Front-end portfolio showcasing responsive UI, JavaScript and React projects. Open to frontend roles (remote)."
        }
      />
      <meta
        name={"twitter:image"}
        content={"https://yourdomain.example/mypictop.jpg"}
      />
      <link rel={"preconnect"} href={"https://fonts.googleapis.com"} />
      <link
        rel={"preconnect"}
        href={"https://fonts.gstatic.com"}
        crossOrigin={""}
      />
      <link
        href={"https://fonts.googleapis.com/css2?family=Michroma&display=swap"}
        rel={"stylesheet"}
      />
      <link rel={"preconnect"} href={"https://fonts.googleapis.com"} />
      <link
        rel={"preconnect"}
        href={"https://fonts.gstatic.com"}
        crossOrigin={""}
      />
      <link
        href={
          "https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&display=swap"
        }
        rel={"stylesheet"}
      />
      <script
        type={"application/ld+json"}
        dangerouslySetInnerHTML={{
          __html:
            '\n  {\n    "@context": "https://schema.org",\n    "@type": "Person",\n    "name": "Worlu Prince",\n    "url": https://worlu-prince.vercel.app/,\n    "jobTitle": "Junior Front-end Developer",\n    "sameAs": ["https://github.com/Themultidev","https://www.linkedin.com/in/worlu-prince-796449376"],\n    "description": "Junior Front-end Developer specializing in HTML, CSS, JavaScript, React and Tailwind CSS. Open to front-end positions and remote opportunities."\n  }\n  ',
        }}
      />
    </>
  );
}
