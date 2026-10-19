export const uploadKinds = ["stack", "project", "resume"] as const;
export type UploadKind = (typeof uploadKinds)[number];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export function isUploadKind(kind: string): kind is UploadKind {
  return (uploadKinds as readonly string[]).includes(kind);
}
export function validStagingPath(
  path: string,
  adminId: number,
  kind?: UploadKind,
) {
  const match =
    /^portfolio-staging\/([1-9][0-9]*)\/(stack|project|resume)\/[a-f0-9-]{36}\.bin$/.exec(
      path,
    );
  return Boolean(
    match && match[1] === String(adminId) && (!kind || match[2] === kind),
  );
}
