/*
  Warnings:

  - The `reclamosAsignados` column on the `Cuadrilla` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Cuadrilla" ADD COLUMN     "ultimaAsignacion" TIMESTAMP(3),
DROP COLUMN "reclamosAsignados",
ADD COLUMN     "reclamosAsignados" INTEGER[];

-- AlterTable
ALTER TABLE "RegistroReclamo" ADD COLUMN     "barrio" TEXT,
ADD COLUMN     "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fechaSolucion" TIMESTAMP(3),
ALTER COLUMN "prioridad" DROP NOT NULL,
ALTER COLUMN "detalle" DROP NOT NULL;
