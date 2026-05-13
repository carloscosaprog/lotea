CREATE TABLE "lote_categoria" (
    "id_lote" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,

    CONSTRAINT "lote_categoria_pkey" PRIMARY KEY ("id_lote","id_categoria")
);

INSERT INTO "lote_categoria" ("id_lote", "id_categoria")
SELECT "id_lote", "id_categoria"
FROM "lote"
WHERE "id_categoria" IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE "lote_categoria" ADD CONSTRAINT "lote_categoria_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lote_categoria" ADD CONSTRAINT "lote_categoria_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE CASCADE ON UPDATE CASCADE;
