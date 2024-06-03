-- CreateTable
CREATE TABLE "Cuadrilla" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "limiteReclamosSimultaneos" INTEGER NOT NULL,
    "reclamosAsignados" INTEGER NOT NULL,
    "direccion" TEXT NOT NULL,

    CONSTRAINT "Cuadrilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroReclamo" (
    "id" SERIAL NOT NULL,
    "cuadrillaId" INTEGER NOT NULL,
    "reclamo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "direccion" TEXT,
    "fechaAsignacion" TIMESTAMP(3),

    CONSTRAINT "RegistroReclamo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RegistroReclamo" ADD CONSTRAINT "RegistroReclamo_cuadrillaId_fkey" FOREIGN KEY ("cuadrillaId") REFERENCES "Cuadrilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
