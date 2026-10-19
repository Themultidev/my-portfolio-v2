"use client";
import { useEffect, useState } from "react";
type Nearby = {
  country: { code: string; name: string } | null;
  region: { code: string; name: string } | null;
  scope: "region" | "country";
  projects: {
    id: number;
    title: string;
    description: string | null;
    photoUrl: string | null;
    link: string | null;
    repoUrl: string | null;
  }[];
};
export default function NearbyProjects() {
  const [nearby, setNearby] = useState<Nearby | null>(null),
    [opened, setOpened] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/nearby", {
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.ok) setNearby(await response.json());
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!nearby?.country) return null;
  const place = nearby.region?.name ?? nearby.country.name;
  const matchPlace = nearby.scope === "region" ? place : nearby.country.name;
  return (
    <aside
      data-nearby-projects=""
      className="mx-6 mt-12 rounded-2xl border border-cyan-400/60 bg-gray-950 p-6 text-white md:mx-16 lg:mx-24"
    >
      <p className="text-xs uppercase tracking-widest text-cyan-400">
        Built for people around you
      </p>
      <h2 className="mt-2 text-xl font-bold md:text-2xl">
        Looks like you’re in {place}.
      </h2>
      {nearby.projects.length > 0 ? (
        <>
          <p className="mt-3 text-gray-300">
            {nearby.region && nearby.scope === "country"
              ? `I haven’t added a project in ${place} yet. Explore my work for people in ${nearby.country.name}.`
              : `See projects I built for people around you in ${matchPlace}.`}
          </p>
          <button
            type="button"
            className="mt-4 rounded-full border border-cyan-400 px-5 py-3 text-cyan-400 hover:bg-cyan-400 hover:text-black"
            aria-expanded={opened}
            aria-controls="nearby-project-list"
            onClick={() => setOpened(!opened)}
          >
            {opened ? "Hide nearby projects" : `See projects in ${matchPlace}`}
          </button>
          {opened && (
            <ul
              id="nearby-project-list"
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              {nearby.projects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-xl border border-gray-700 p-4"
                >
                  {project.photoUrl && (
                    <img
                      src={project.photoUrl}
                      alt={project.title}
                      className="mb-3 h-40 w-full rounded object-cover"
                    />
                  )}
                  <h3 className="font-bold text-cyan-400">{project.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
                    {project.description}
                  </p>
                  {project.link || project.repoUrl ? (
                    <a
                      href={project.link ?? project.repoUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block underline"
                    >
                      View project
                    </a>
                  ) : (
                    <a
                      href={`#${({ 1: "boxOne", 2: "boxTwo", 3: "boxThree", 4: "boxFour" } as Record<number, string>)[project.id] ?? `project-${project.id}`}`}
                      className="mt-3 inline-block underline"
                    >
                      View in portfolio
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-3 text-gray-300">
          I’m building toward more local projects. There aren’t any tagged for{" "}
          {place} yet—explore all my work below.
        </p>
      )}
      <a
        href="#projects"
        className="ml-0 mt-4 block text-sm text-cyan-400 underline"
      >
        Explore all projects
      </a>
      <p className="mt-3 text-xs text-gray-500">
        Approximate location from your network; VPNs and mobile networks can
        affect the estimate.
      </p>
    </aside>
  );
}
