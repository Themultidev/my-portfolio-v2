export const siteLinkKeys = {
  resume: "site.resume.url",
  x: "site.social.x",
  linkedin: "site.social.linkedin",
} as const;
export type SiteLinkKind = keyof typeof siteLinkKeys;
export function isSiteLinkKey(key: string) {
  return (Object.values(siteLinkKeys) as string[]).includes(key);
}
