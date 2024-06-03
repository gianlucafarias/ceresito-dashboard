/*
  Warnings:

  - Added the required column `reclamoId` to the `RegistroReclamo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistroReclamo" ADD COLUMN     "reclamoId" INTEGER NOT NULL;
