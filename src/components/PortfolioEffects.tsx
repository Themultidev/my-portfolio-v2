"use client";

import { useEffect } from "react";
import AOS from "aos";
import emailjs from "@emailjs/browser";

export default function PortfolioEffects({
  editable = false,
}: {
  editable?: boolean;
}) {
  useEffect(() => {
    AOS.init({ duration: 1000, once: false });

    const form = document.getElementById(
      "contactForm",
    ) as HTMLFormElement | null;
    if (!form) return;

    function submit(event: SubmitEvent) {
      event.preventDefault();
      if (editable) return;
      emailjs
        .sendForm(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
          form!,
          process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!,
        )
        .then(() => {
          alert("Message sent successfully!");
          form!.reset();
        })
        .catch((error: unknown) => {
          console.error("EmailJS error:", error);
          alert("Something went wrong. Please try again.");
        });
    }

    form.addEventListener("submit", submit);
    return () => form.removeEventListener("submit", submit);
  }, [editable]);

  return null;
}
