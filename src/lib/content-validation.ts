import { z } from "zod";

export const CONTENT_MAX_LENGTH = 10_000;

function isUnicodeText(value: string) {
  // Iteration combines valid surrogate pairs but leaves lone surrogates intact.
  for (const character of value) {
    const code = character.codePointAt(0)!;
    if (code >= 0xd800 && code <= 0xdfff) return false;
  }
  return true;
}

export const contentKeySchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/, "Use a valid content key.");

export const contentPatchSchema = z
  .object({
    value: z
      .string()
      // Use the same string length as an HTML input's maxlength. Zod's
      // string max check measures Unicode code points in the installed version.
      .refine(
        (value) => value.length <= CONTENT_MAX_LENGTH,
        "Use at most 10000 characters.",
      )
      .refine(
        (value) =>
          !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
        "Remove unsupported control characters.",
      )
      .refine(isUnicodeText, "Use valid Unicode text."),
  })
  .strict();
