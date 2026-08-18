import { env } from "../../config/env.js";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { createOAuthState, encryptSecret, verifyOAuthState } from "./integration-crypto.js";
import { getProvider, providerNames, providers } from "./providers.js";

function callbackUrl(provider: string) { return `${env.API_PUBLIC_URL}/api/integrations/${provider}/callback`; }

export const integrationsService = {
  async list(userId: string) {
    const connected = await prisma.socialAccount.findMany({ where: { userId }, select: { provider: true, displayHandle: true, connectedAt: true, lastSyncedAt: true } });
    return providerNames.map((name) => {
      const definition = providers[name]; const account = connected.find((item) => item.provider === definition.prismaName);
      return { name, label: definition.label, configured: Boolean(definition.clientId && definition.clientSecret), connected: Boolean(account), handle: account?.displayHandle, connectedAt: account?.connectedAt, lastSyncedAt: account?.lastSyncedAt };
    });
  },
  connect(userId: string, providerName: string) {
    const provider = getProvider(providerName);
    if (!provider.clientId || !provider.clientSecret) throw new AppError(503, "PROVIDER_NOT_CONFIGURED", `${provider.label} has not been configured by the SocialVerse operator.`);
    const state = createOAuthState(userId, providerName);
    const url = new URL(provider.authorizationUrl);
    url.searchParams.set("client_id", provider.clientId); url.searchParams.set("redirect_uri", callbackUrl(providerName)); url.searchParams.set("response_type", "code"); url.searchParams.set("state", state); url.searchParams.set("scope", provider.scopes.join(" "));
    if (providerName === "youtube") { url.searchParams.set("access_type", "offline"); url.searchParams.set("prompt", "consent"); }
    return { authorizationUrl: url.toString() };
  },
  async callback(providerName: string, code: string, stateValue: string) {
    const state = verifyOAuthState(stateValue);
    if (state.provider !== providerName) throw new AppError(400, "INVALID_OAUTH_STATE", "The account connection request does not match the provider.");
    const provider = getProvider(providerName);
    if (!provider.clientId || !provider.clientSecret) throw new AppError(503, "PROVIDER_NOT_CONFIGURED", `${provider.label} has not been configured.`);
    const token = await provider.exchange(code, callbackUrl(providerName));
    const identity = await provider.identity(token.accessToken);
    await prisma.socialAccount.upsert({
      where: { userId_provider: { userId: state.userId, provider: provider.prismaName } },
      create: { userId: state.userId, provider: provider.prismaName, providerAccountId: identity.accountId, displayHandle: identity.handle ?? null, metadata: identity.metadata as Prisma.InputJsonValue, accessTokenCipher: encryptSecret(token.accessToken), ...(token.refreshToken ? { refreshTokenCipher: encryptSecret(token.refreshToken) } : {}), ...(token.expiresIn ? { tokenExpiresAt: new Date(Date.now() + token.expiresIn * 1000) } : {}), scopes: token.scopes, lastSyncedAt: new Date() },
      update: { providerAccountId: identity.accountId, displayHandle: identity.handle ?? null, metadata: identity.metadata as Prisma.InputJsonValue, accessTokenCipher: encryptSecret(token.accessToken), ...(token.refreshToken ? { refreshTokenCipher: encryptSecret(token.refreshToken) } : {}), tokenExpiresAt: token.expiresIn ? new Date(Date.now() + token.expiresIn * 1000) : null, scopes: token.scopes, lastSyncedAt: new Date() },
    });
    return provider.label;
  },
  async disconnect(userId: string, providerName: string) {
    const provider = getProvider(providerName);
    await prisma.socialAccount.deleteMany({ where: { userId, provider: provider.prismaName } });
  },
};
