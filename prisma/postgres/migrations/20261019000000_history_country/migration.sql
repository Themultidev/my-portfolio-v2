ALTER TABLE "Project" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "Project" ADD COLUMN "regionCode" TEXT;
CREATE TABLE "PortfolioRevision" (
  "id" SERIAL NOT NULL,
  "label" TEXT NOT NULL,
  "before" TEXT NOT NULL,
  "after" TEXT NOT NULL,
  "undone" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PortfolioRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PortfolioHistoryState" (
  "id" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PortfolioHistoryState_pkey" PRIMARY KEY ("id")
);
