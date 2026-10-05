DROP INDEX "public"."Sector_name_key";

CREATE UNIQUE INDEX "Sector_name_active_key"
ON "public"."Sector" ("name")
WHERE "isActive" = true;
