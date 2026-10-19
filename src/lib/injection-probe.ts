export const INJECTION_MESSAGE =
  "you can do better than this comment trick pal, that you obviously found on the internet. but do well to share my link thank you";
// A custom response for recognizable probes, never a replacement for bound
// database parameters. Do not apply this to saved portfolio text or valid logins.
export function isInjectionProbe(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /(?:['"`]\s*(?:--|#|\/\*)|\b(?:or|and)\s+(?:\d+\s*=\s*\d+|['"][^'"]{0,32}['"]\s*=\s*['"][^'"]{0,32}['"])[\s\S]{0,32}(?:--|#|\/\*)|\bunion\s+(?:all\s+)?select\b|;\s*(?:drop|truncate|alter)\s+table\b)/i.test(
      value.slice(0, 4096),
    )
  );
}
export function isInjectionQuery(url: URL): boolean {
  return [...url.searchParams.values()].some(isInjectionProbe);
}
