"use client";
import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ProjectRecord } from "../../lib/project-types";
import { uploadPortfolioFile } from "../../lib/upload-client";

export const ProjectBoardContext = createContext<{
  records: ProjectRecord[];
  setRecords: Dispatch<SetStateAction<ProjectRecord[]>>;
} | null>(null);
export const useProjectBoard = () => useContext(ProjectBoardContext);

export async function projectRequest(
  path: string,
  method: string,
  data?: unknown,
) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    signal: AbortSignal.timeout(30_000),
    headers: { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(
      body?.error?.message ??
        "Unable to save. Your draft is still here; try again.",
    );
    Object.assign(error, { fields: body?.error?.fields ?? {} });
    throw error;
  }
  return body;
}

export async function uploadProjectPhoto(file: File) {
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
    throw new Error("Choose an image no larger than 5 MB.");
  return uploadPortfolioFile(file, "project");
}
