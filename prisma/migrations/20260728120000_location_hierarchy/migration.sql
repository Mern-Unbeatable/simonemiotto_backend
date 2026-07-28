-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- Rename existing City table to cities if needed, or map City -> cities
-- Prisma previously used "City" default table name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'City'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cities'
  ) THEN
    ALTER TABLE "City" RENAME TO "cities";
  END IF;
END $$;

-- Ensure cities table exists for fresh installs that already use @@map
-- (no-op if renamed above)

-- Add provinceId as nullable first for backfill
ALTER TABLE "cities" ADD COLUMN IF NOT EXISTS "provinceId" TEXT;

-- Seed placeholder regione/provincia for existing città rows
INSERT INTO "regions" ("id", "name", "slug", "isDeleted", "createdAt", "updatedAt")
SELECT 'seed_region_unassigned', 'Da assegnare', 'da-assegnare', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "regions" WHERE "id" = 'seed_region_unassigned');

INSERT INTO "provinces" ("id", "name", "slug", "isDeleted", "regionId", "createdAt", "updatedAt")
SELECT 'seed_province_unassigned', 'Da assegnare', 'da-assegnare', false, 'seed_region_unassigned', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "provinces" WHERE "id" = 'seed_province_unassigned');

UPDATE "cities"
SET "provinceId" = 'seed_province_unassigned'
WHERE "provinceId" IS NULL;

-- Drop old unique on name if present
ALTER TABLE "cities" DROP CONSTRAINT IF EXISTS "City_name_key";
ALTER TABLE "cities" DROP CONSTRAINT IF EXISTS "cities_name_key";

ALTER TABLE "cities" ALTER COLUMN "provinceId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "regions_name_key" ON "regions"("name");

CREATE UNIQUE INDEX IF NOT EXISTS "provinces_name_regionId_key" ON "provinces"("name", "regionId");

CREATE INDEX IF NOT EXISTS "provinces_regionId_idx" ON "provinces"("regionId");

CREATE UNIQUE INDEX IF NOT EXISTS "cities_name_provinceId_key" ON "cities"("name", "provinceId");

CREATE INDEX IF NOT EXISTS "cities_provinceId_idx" ON "cities"("provinceId");

ALTER TABLE "provinces" DROP CONSTRAINT IF EXISTS "provinces_regionId_fkey";
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cities" DROP CONSTRAINT IF EXISTS "cities_provinceId_fkey";
ALTER TABLE "cities" ADD CONSTRAINT "cities_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
