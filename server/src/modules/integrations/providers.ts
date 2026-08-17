import type { SocialProvider } from "@prisma/client";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";

export const providerNames = ["github", "youtube", "twitch", "spotify"] as const;
export type ProviderName = typeof providerNames[number];

export interface ProviderIdentity { accountId: string; handle?: string; metadata: Record<string, unknown> }
export interface ProviderToken { accessToken: string; refreshToken?: string | undefined; expiresIn?: number | undefined; scopes: string[] }

interface ProviderDefinition {
  prismaName: SocialProvider;
  label: string;
  clientId: string | undefined;
  clientSecret: string | undefined;
  authorizationUrl: string;
  scopes: string[];
  exchange(code: string, callbackUrl: string): Promise<ProviderToken>;
  identity(token: string): Promise<ProviderIdentity>;
}

async function jsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new AppError(502, "PROVIDER_REQUEST_FAILED", "The social provider did not complete the request.");
  return response.json() as Promise<T>;
}

function formToken(body: Record<string, string>, headers?: Record<string, string>) {
  const url = body.__url;
  if (!url) throw new AppError(500, "PROVIDER_CONFIGURATION_ERROR", "The social provider token endpoint is missing.");
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers }, body: new URLSearchParams(Object.fromEntries(Object.entries(body).filter(([key]) => key !== "__url"))) });
}

export const providers: Record<ProviderName, ProviderDefinition> = {
  github: {
    prismaName: "GITHUB", label: "GitHub", clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET,
    authorizationUrl: "https://github.com/login/oauth/authorize", scopes: ["read:user"],
    async exchange(code, callbackUrl) {
      const data = await jsonResponse<{access_token: string; scope?: string}>(await formToken({ __url: "https://github.com/login/oauth/access_token", client_id: this.clientId!, client_secret: this.clientSecret!, code, redirect_uri: callbackUrl }, { Accept: "application/json" }));
      return { accessToken: data.access_token, scopes: data.scope?.split(",").filter(Boolean) ?? [] };
    },
    async identity(token) {
      const data = await jsonResponse<{id: number; login: string; name?: string; avatar_url?: string; followers?: number; following?: number; public_repos?: number}>(await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } }));
      return { accountId: String(data.id), handle: data.login, metadata: { name: data.name, avatarUrl: data.avatar_url, followers: data.followers, following: data.following, publicRepos: data.public_repos } };
    },
  },
  youtube: {
    prismaName: "YOUTUBE", label: "YouTube", clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth", scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
    async exchange(code, callbackUrl) {
      const data = await jsonResponse<{access_token: string; refresh_token?: string; expires_in?: number; scope?: string}>(await formToken({ __url: "https://oauth2.googleapis.com/token", client_id: this.clientId!, client_secret: this.clientSecret!, code, redirect_uri: callbackUrl, grant_type: "authorization_code" }));
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, scopes: data.scope?.split(" ").filter(Boolean) ?? [] };
    },
    async identity(token) {
      const data = await jsonResponse<{items?: Array<{id: string; snippet: {title: string; customUrl?: string; thumbnails?: {default?: {url: string}}}; statistics?: Record<string, string>}>}>(await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", { headers: { Authorization: `Bearer ${token}` } }));
      const channel = data.items?.[0]; if (!channel) throw new AppError(422, "YOUTUBE_CHANNEL_REQUIRED", "No YouTube channel was found for this account.");
      return { accountId: channel.id, handle: channel.snippet.customUrl ?? channel.snippet.title, metadata: { title: channel.snippet.title, avatarUrl: channel.snippet.thumbnails?.default?.url, statistics: channel.statistics } };
    },
  },
  twitch: {
    prismaName: "TWITCH", label: "Twitch", clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET,
    authorizationUrl: "https://id.twitch.tv/oauth2/authorize", scopes: ["user:read:email"],
    async exchange(code, callbackUrl) {
      const data = await jsonResponse<{access_token: string; refresh_token?: string; expires_in?: number; scope?: string[]}>(await formToken({ __url: "https://id.twitch.tv/oauth2/token", client_id: this.clientId!, client_secret: this.clientSecret!, code, redirect_uri: callbackUrl, grant_type: "authorization_code" }));
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, scopes: data.scope ?? [] };
    },
    async identity(token) {
      const data = await jsonResponse<{data?: Array<{id: string; login: string; display_name: string; profile_image_url?: string; description?: string}>}>(await fetch("https://api.twitch.tv/helix/users", { headers: { Authorization: `Bearer ${token}`, "Client-Id": this.clientId! } }));
      const user = data.data?.[0]; if (!user) throw new AppError(422, "TWITCH_USER_REQUIRED", "No Twitch user was found for this account.");
      return { accountId: user.id, handle: user.login, metadata: { displayName: user.display_name, avatarUrl: user.profile_image_url, description: user.description } };
    },
  },
  spotify: {
    prismaName: "SPOTIFY", label: "Spotify", clientId: env.SPOTIFY_CLIENT_ID, clientSecret: env.SPOTIFY_CLIENT_SECRET,
    authorizationUrl: "https://accounts.spotify.com/authorize", scopes: ["user-read-private"],
    async exchange(code, callbackUrl) {
      const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
      const data = await jsonResponse<{access_token: string; refresh_token?: string; expires_in?: number; scope?: string}>(await formToken({ __url: "https://accounts.spotify.com/api/token", code, redirect_uri: callbackUrl, grant_type: "authorization_code" }, { Authorization: `Basic ${basic}` }));
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, scopes: data.scope?.split(" ").filter(Boolean) ?? [] };
    },
    async identity(token) {
      const data = await jsonResponse<{id: string; display_name?: string; images?: Array<{url: string}>; followers?: {total: number}; external_urls?: {spotify?: string}}>(await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${token}` } }));
      return { accountId: data.id, handle: data.display_name ?? data.id, metadata: { displayName: data.display_name, avatarUrl: data.images?.[0]?.url, followers: data.followers?.total, profileUrl: data.external_urls?.spotify } };
    },
  },
};

export function getProvider(name: string) {
  if (!providerNames.includes(name as ProviderName)) throw new AppError(404, "UNKNOWN_PROVIDER", "That social provider is not supported.");
  return providers[name as ProviderName];
}
