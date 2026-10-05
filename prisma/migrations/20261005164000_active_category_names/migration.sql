DROP INDEX "public"."Category_name_key";

CREATE UNIQUE INDEX "Category_name_active_key"
ON "public"."Category" ("name")
WHERE "isActive" = true;
