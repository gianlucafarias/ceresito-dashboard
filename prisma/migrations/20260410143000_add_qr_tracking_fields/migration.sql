ALTER TABLE "QrCode"
ADD COLUMN "trackingId" TEXT,
ADD COLUMN "trackingRedirectUrl" TEXT;

CREATE UNIQUE INDEX "QrCode_trackingId_key" ON "QrCode"("trackingId");
