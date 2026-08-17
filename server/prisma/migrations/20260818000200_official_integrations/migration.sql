ALTER TABLE "SocialAccount"
  ADD COLUMN "accessTokenCipher" TEXT,
  ADD COLUMN "refreshTokenCipher" TEXT,
  ADD COLUMN "tokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
