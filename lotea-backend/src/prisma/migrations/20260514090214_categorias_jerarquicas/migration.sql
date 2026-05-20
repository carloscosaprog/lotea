/*
  Warnings:

  - You are about to drop the column `id_categoria` on the `lote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `categoria` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nombre,id_padre]` on the table `categoria` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `categoria` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "lote" DROP CONSTRAINT "lote_id_categoria_fkey";

-- DropIndex
DROP INDEX "categoria_nombre_key";

-- AlterTable
ALTER TABLE "categoria" ADD COLUMN     "icono" VARCHAR(100),
ADD COLUMN     "id_padre" INTEGER,
ADD COLUMN     "imagen" VARCHAR(255),
ADD COLUMN     "slug" VARCHAR(120) NOT NULL;

-- AlterTable
ALTER TABLE "lote" DROP COLUMN "id_categoria";

-- CreateIndex
CREATE UNIQUE INDEX "categoria_slug_key" ON "categoria"("slug");

-- CreateIndex
CREATE INDEX "categoria_id_padre_idx" ON "categoria"("id_padre");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_id_padre_key" ON "categoria"("nombre", "id_padre");

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_id_padre_fkey" FOREIGN KEY ("id_padre") REFERENCES "categoria"("id_categoria") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_favorito_usuario" RENAME TO "favorito_id_usuario_idx";
