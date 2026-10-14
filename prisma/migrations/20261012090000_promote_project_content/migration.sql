-- Preserve title/description edits made through the full-page text editor.
-- Prisma records this data migration once; later edits use the Project table.
UPDATE "Project" SET
  "title" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.003'), "title"),
  "description" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.004'), "description")
WHERE "id" = 1;
UPDATE "Project" SET
  "title" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.007'), "title"),
  "description" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.008'), "description")
WHERE "id" = 2;
UPDATE "Project" SET
  "title" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.011'), "title"),
  "description" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.012'), "description")
WHERE "id" = 3;
UPDATE "Project" SET
  "title" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.015'), "title"),
  "description" = COALESCE((SELECT "value" FROM "ContentBlock" WHERE "key" = 'projects.text.016'), "description")
WHERE "id" = 4;
