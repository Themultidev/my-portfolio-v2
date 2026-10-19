import HistoryControls from "./HistoryControls";
export default function AdminToolbar() {
  return (
    <nav
      aria-label="Admin navigation"
      data-admin-toolbar=""
      className="fixed bottom-4 left-4 z-[90] flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-2 rounded-lg border border-cyan-400 bg-black px-3 py-2 text-sm text-white shadow-lg"
    >
      <HistoryControls />
      <a
        href="/admin/edit/portfolio"
        className="rounded px-2 py-1 text-cyan-400 hover:bg-cyan-400 hover:text-black"
      >
        Portfolio
      </a>
      <a
        href="/admin/edit/overview"
        className="rounded px-2 py-1 text-cyan-400 hover:bg-cyan-400 hover:text-black"
      >
        Overview
      </a>
      <a
        href="/admin/projects"
        className="rounded px-2 py-1 text-cyan-400 hover:bg-cyan-400 hover:text-black"
      >
        Projects
      </a>
      <a
        href="/admin/stacks"
        className="rounded px-2 py-1 text-cyan-400 hover:bg-cyan-400 hover:text-black"
      >
        Stack icons
      </a>
      <a
        href="/"
        className="rounded px-2 py-1 text-cyan-400 hover:bg-cyan-400 hover:text-black"
      >
        View site
      </a>
    </nav>
  );
}
