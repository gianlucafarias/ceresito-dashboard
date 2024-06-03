/*
  Warnings:

  - You are about to drop the column `direccion` on the `Cuadrilla` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cuadrilla" DROP COLUMN "direccion",
ALTER COLUMN "limiteReclamosSimultaneos" SET DEFAULT 1,
ALTER COLUMN "reclamosAsignados" SET DEFAULT 0;
