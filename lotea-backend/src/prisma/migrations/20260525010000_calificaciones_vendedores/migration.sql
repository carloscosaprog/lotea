CREATE TABLE "calificacion" (
  "id_calificacion" SERIAL NOT NULL,
  "id_pedido" INTEGER NOT NULL,
  "id_comprador" INTEGER NOT NULL,
  "id_vendedor" INTEGER NOT NULL,
  "puntuacion" INTEGER NOT NULL,
  "comentario" TEXT,
  "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "calificacion_pkey" PRIMARY KEY ("id_calificacion"),
  CONSTRAINT "calificacion_puntuacion_check" CHECK ("puntuacion" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "calificacion_id_pedido_key" ON "calificacion"("id_pedido");
CREATE INDEX "calificacion_id_vendedor_fecha_creacion_idx" ON "calificacion"("id_vendedor", "fecha_creacion");
CREATE INDEX "calificacion_id_comprador_idx" ON "calificacion"("id_comprador");

ALTER TABLE "calificacion"
  ADD CONSTRAINT "calificacion_id_pedido_fkey"
  FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "calificacion"
  ADD CONSTRAINT "calificacion_id_comprador_fkey"
  FOREIGN KEY ("id_comprador") REFERENCES "usuario"("id_usuario")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "calificacion"
  ADD CONSTRAINT "calificacion_id_vendedor_fkey"
  FOREIGN KEY ("id_vendedor") REFERENCES "usuario"("id_usuario")
  ON DELETE RESTRICT ON UPDATE CASCADE;
