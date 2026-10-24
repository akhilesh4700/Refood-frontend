-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderOrgId" TEXT NOT NULL,
    "senderRole" "UserRole" NOT NULL,
    "senderName" TEXT NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessage_reservationId_idx" ON "ChatMessage"("reservationId");

-- CreateIndex
CREATE INDEX "ChatMessage_reservationId_createdAt_idx" ON "ChatMessage"("reservationId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_senderOrgId_idx" ON "ChatMessage"("senderOrgId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderOrgId_fkey" FOREIGN KEY ("senderOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
