import "server-only";
import { cache } from "react";
import { listProjects } from "./project-store";

// Share one query within a render; changed cards are read again on the next request.
export const getProjectRecords = cache(async () => listProjects());
