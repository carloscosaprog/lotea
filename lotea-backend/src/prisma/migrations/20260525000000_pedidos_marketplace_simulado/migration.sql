-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('tarjeta', 'paypal', 'bizum', 'transferencia');

-- Update EstadoPedido with the new marketplace workflow.
ALTER TYPE "EstadoPedido" RENAME TO "EstadoPedido_old";
CREATE TYPE "EstadoPedido" AS ENUM ('pendiente_pago', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado');

ALTER TABLE "pedido"
  ALTER COLUMN "estado" DROP DEFAULT,
  ALTER COLUMN "estado" TYPE "EstadoPedido"
    USING (
      CASE "estado"::text
        WHEN 'pendiente' THEN 'pendiente_pago'
        WHEN 'completado' THEN 'entregado'
        WHEN 'cancelado' THEN 'cancelado'
        ELSE 'pendiente_pago'
      END
    )::"EstadoPedido",
  ALTER COLUMN "estado" SET DEFAULT 'pendiente_pago';

DROP TYPE "EstadoPedido_old";

-- Extend pedidos with simulated payment and delivery metadata.
ALTER TABLE "pedido"
  ADD COLUMN "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "metodo_pago" "MetodoPago",
  ADD COLUMN "direccion_entrega" TEXT;

-- Seller notifications for order events.
CREATE TABLE "notificacion" (
  "id_notificacion" SERIAL NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "contenido" TEXT NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'pedido',
  "leida" BOOLEAN NOT NULL DEFAULT false,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

CREATE INDEX "notificacion_id_usuario_leida_idx" ON "notificacion"("id_usuario", "leida");

ALTER TABLE "notificacion"
  ADD CONSTRAINT "notificacion_id_usuario_fkey"
  FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario")
  ON DELETE CASCADE ON UPDATE CASCADE;
