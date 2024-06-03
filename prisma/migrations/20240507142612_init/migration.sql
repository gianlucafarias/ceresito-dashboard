/*
  Warnings:

  - You are about to drop the `TipoCuadrilla` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CuadrillaToTipoCuadrilla` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CuadrillaToTipoCuadrilla" DROP CONSTRAINT "_CuadrillaToTipoCuadrilla_A_fkey";

-- DropForeignKey
ALTER TABLE "_CuadrillaToTipoCuadrilla" DROP CONSTRAINT "_CuadrillaToTipoCuadrilla_B_fkey";

-- DropTable
DROP TABLE "TipoCuadrilla";

-- DropTable
DROP TABLE "_CuadrillaToTipoCuadrilla";

-- CreateTable
CREATE TABLE "TipoReclamo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "TipoReclamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CuadrillaToTipoReclamo" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CuadrillaToTipoReclamo_AB_unique" ON "_CuadrillaToTipoReclamo"("A", "B");

-- CreateIndex
CREATE INDEX "_CuadrillaToTipoReclamo_B_index" ON "_CuadrillaToTipoReclamo"("B");

-- AddForeignKey
ALTER TABLE "_CuadrillaToTipoReclamo" ADD CONSTRAINT "_CuadrillaToTipoReclamo_A_fkey" FOREIGN KEY ("A") REFERENCES "Cuadrilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CuadrillaToTipoReclamo" ADD CONSTRAINT "_CuadrillaToTipoReclamo_B_fkey" FOREIGN KEY ("B") REFERENCES "TipoReclamo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
