/*
  Warnings:

  - Added the required column `telefono` to the `Cuadrilla` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cuadrilla" ADD COLUMN     "telefono" TEXT NOT NULL;
