-- CreateEnum
CREATE TYPE "BrokerConnectMethod" AS ENUM ('PERSONAL_TOKEN', 'PARTNER_OAUTH');

-- CreateEnum
CREATE TYPE "BrokerConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "BrokerConnection" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "dhanClientId" TEXT NOT NULL,
    "dhanClientName" TEXT,
    "connectMethod" "BrokerConnectMethod" NOT NULL DEFAULT 'PERSONAL_TOKEN',
    "accessTokenEnc" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" "BrokerConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerConnection_subscriberId_key" ON "BrokerConnection"("subscriberId");

-- AddForeignKey
ALTER TABLE "BrokerConnection" ADD CONSTRAINT "BrokerConnection_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
