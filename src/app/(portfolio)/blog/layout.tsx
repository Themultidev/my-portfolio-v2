import type { ReactNode } from "react";
import SiteNavigation from "../../../components/portfolio/SiteNavigation";
import EditModeProvider from "../../../components/editor/EditModeProvider";
import BlogMusic from "../../../components/portfolio/BlogMusic";
import { getContentBlocks } from "../../../lib/content";
import { getSiteSettings } from "../../../lib/settings-store";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Notes & perspectives — Worlu Prince",
  description: "What I’ve been building, learning and thinking about lately.",
};
export default async function BlogLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [blocks, settings] = await Promise.all([
    getContentBlocks(),
    getSiteSettings(),
  ]);
  return (
    <EditModeProvider blocks={blocks} editable={false}>
      <SiteNavigation />
      {children}
      <footer className="blog-footer">
        <a className="wordmark" href="/">
          Themultidev<span className="accent">.</span>
        </a>
        <p>Code, curiosity & everything in between.</p>
        <a href="/#contact">Let’s connect ↗</a>
      </footer>
      <BlogMusic music={settings.music} />
    </EditModeProvider>
  );
}
