-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('pendiente', 'completado', 'cancelado');

-- CreateEnum
CREATE TYPE "EstadoGrupo" AS ENUM ('abierto', 'cerrado');

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "contrasena" VARCHAR(255) NOT NULL,
    "avatar" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id_categoria" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "lote" (
    "id_lote" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "id_vendedor" INTEGER NOT NULL,
    "id_categoria" INTEGER,
    "fecha_publicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lote_pkey" PRIMARY KEY ("id_lote")
);

-- CreateTable
CREATE TABLE "imagen_lote" (
    "id_imagen" SERIAL NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "imagen_lote_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateTable
CREATE TABLE "favorito" (
    "id_favorito" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorito_pkey" PRIMARY KEY ("id_favorito")
);

-- CreateTable
CREATE TABLE "pedido" (
    "id_pedido" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'pendiente',
    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "detalle_pedido" (
    "id_detalle" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "detalle_pedido_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "grupo_compra" (
    "id_grupo" SERIAL NOT NULL,
    "id_lote" INTEGER NOT NULL,
    "id_creador" INTEGER NOT NULL,
    "cantidad_objetivo" INTEGER NOT NULL,
    "estado" "EstadoGrupo" NOT NULL DEFAULT 'abierto',
    CONSTRAINT "grupo_compra_pkey" PRIMARY KEY ("id_grupo")
);

-- CreateTable
CREATE TABLE "participacion_grupo" (
    "id_participacion" SERIAL NOT NULL,
    "id_grupo" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "cantidad_aportada" INTEGER NOT NULL,
    CONSTRAINT "participacion_grupo_pkey" PRIMARY KEY ("id_participacion")
);

-- CreateTable
CREATE TABLE "solicitud_lote" (
    "id_solicitud" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "solicitud_lote_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "mensaje" (
    "id_mensaje" SERIAL NOT NULL,
    "id_emisor" INTEGER NOT NULL,
    "id_receptor" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mensaje_pkey" PRIMARY KEY ("id_mensaje")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");
CREATE UNIQUE INDEX "favorito_id_usuario_id_lote_key" ON "favorito"("id_usuario", "id_lote");
CREATE INDEX "idx_favorito_usuario" ON "favorito"("id_usuario");

-- AddForeignKey
ALTER TABLE "lote" ADD CONSTRAINT "lote_id_vendedor_fkey" FOREIGN KEY ("id_vendedor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lote" ADD CONSTRAINT "lote_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "imagen_lote" ADD CONSTRAINT "imagen_lote_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorito" ADD CONSTRAINT "favorito_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grupo_compra" ADD CONSTRAINT "grupo_compra_id_lote_fkey" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grupo_compra" ADD CONSTRAINT "grupo_compra_id_creador_fkey" FOREIGN KEY ("id_creador") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participacion_grupo" ADD CONSTRAINT "participacion_grupo_id_grupo_fkey" FOREIGN KEY ("id_grupo") REFERENCES "grupo_compra"("id_grupo") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participacion_grupo" ADD CONSTRAINT "participacion_grupo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "solicitud_lote" ADD CONSTRAINT "solicitud_lote_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_emisor_fkey" FOREIGN KEY ("id_emisor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mensaje" ADD CONSTRAINT "mensaje_id_receptor_fkey" FOREIGN KEY ("id_receptor") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
