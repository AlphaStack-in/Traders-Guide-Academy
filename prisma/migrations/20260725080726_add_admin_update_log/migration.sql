-- CreateTable
CREATE TABLE "AdminUpdate" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "strike" INTEGER NOT NULL,
    "optionType" "OptionType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminUpdate_createdAt_idx" ON "AdminUpdate"("createdAt");
