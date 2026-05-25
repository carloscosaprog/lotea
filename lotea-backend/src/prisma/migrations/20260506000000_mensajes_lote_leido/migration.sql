ALTER TABLE "mensaje"
ADD COLUMN "id_lote" INTEGER,
ADD COLUMN "leido" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "mensaje_id_lote_idx" ON "mensaje"("id_lote");
CREATE INDEX "mensaje_id_receptor_leido_idx" ON "mensaje"("id_receptor", "leido");

ALTER TABLE "mensaje"
ADD CONSTRAINT "mensaje_id_lote_fkey"
FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote")
ON DELETE CASCADE ON UPDATE CASCADE;
