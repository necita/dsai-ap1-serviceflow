ALTER TABLE "public"."User"
ADD CONSTRAINT "User_role_sectorId_check"
CHECK (
    ("role" = 'ATTENDANT' AND "sectorId" IS NOT NULL)
    OR ("role" <> 'ATTENDANT' AND "sectorId" IS NULL)
);

CREATE INDEX "Request_requesterId_idx"
ON "public"."Request"("requesterId");

CREATE INDEX "Request_sectorId_idx"
ON "public"."Request"("sectorId");
