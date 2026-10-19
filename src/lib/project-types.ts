export interface ProjectStackRecord {
  id: number;
  name: string;
  svgPath: string;
  /** Membership order on this card, rather than catalog order. */
  order: number;
}

export interface ProjectRecord {
  id: number;
  title: string;
  description: string | null;
  photoUrl: string | null;
  link: string | null;
  repoUrl: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  stacks: ProjectStackRecord[];
}
