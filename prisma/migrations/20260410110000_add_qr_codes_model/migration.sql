-- CreateTable
CREATE TABLE "QrCode" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "downloadFileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_storagePath_key" ON "QrCode"("storagePath");

-- CreateIndex
CREATE INDEX "QrCode_createdAt_idx" ON "QrCode"("createdAt");
