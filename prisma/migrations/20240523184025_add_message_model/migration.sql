-- CreateTable
CREATE TABLE "Mensaje" (
    "id" SERIAL NOT NULL,
    "cuadrillaId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "remitente" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_cuadrillaId_fkey" FOREIGN KEY ("cuadrillaId") REFERENCES "Cuadrilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
