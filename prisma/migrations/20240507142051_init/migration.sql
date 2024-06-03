/*
  Warnings:

  - You are about to drop the column `tipo` on the `Cuadrilla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cuadrilla" DROP COLUMN "tipo";

-- CreateTable
CREATE TABLE "TipoCuadrilla" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "TipoCuadrilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CuadrillaToTipoCuadrilla" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CuadrillaToTipoCuadrilla_AB_unique" ON "_CuadrillaToTipoCuadrilla"("A", "B");

-- CreateIndex
CREATE INDEX "_CuadrillaToTipoCuadrilla_B_index" ON "_CuadrillaToTipoCuadrilla"("B");

-- AddForeignKey
ALTER TABLE "_CuadrillaToTipoCuadrilla" ADD CONSTRAINT "_CuadrillaToTipoCuadrilla_A_fkey" FOREIGN KEY ("A") REFERENCES "Cuadrilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CuadrillaToTipoCuadrilla" ADD CONSTRAINT "_CuadrillaToTipoCuadrilla_B_fkey" FOREIGN KEY ("B") REFERENCES "TipoCuadrilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;
