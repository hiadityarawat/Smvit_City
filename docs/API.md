# REST API design

Base path: `/api`. JSON success responses use `{ "data": ..., "meta"?: ... }`; errors use `{ "error": { "code", "message", "details"? } }`. Cursor pagination is used for feeds/graphs; world chunks use spatial bounds plus a hard limit. Mutation endpoints require authentication and CSRF-safe cookie/header handling.

## Official account integrations

- `GET /integrations` — list supported providers and configured/connected state.
- `POST /integrations/:provider/connect` — return the official OAuth authorization URL.
- `GET /integrations/:provider/callback` — provider callback with signed-state validation.
- `DELETE /integrations/:provider` — disconnect the current user's provider account.

Supported adapters are GitHub, YouTube, Twitch, and Spotify. They use read-only/minimum scopes and encrypted token storage. A provider remains disabled until its official app client ID and secret are supplied. Instagram is deliberately not exposed as a generic adapter because Meta product/app-review requirements must be selected for the exact approved use case; no private or legacy Instagram API is used.

## Foundation (implemented)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Process liveness; no database dependency |
| GET | `/ready` | Database readiness |

## Authentication (implemented in Phase 2)

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create identity, profile, privacy row, and allocated building transactionally |
| POST | `/auth/login` | Verify credentials and issue access/refresh session |
| POST | `/auth/refresh` | Rotate refresh token family |
| POST | `/auth/logout` | Revoke current session and clear cookie |
| POST | `/auth/forgot-password` | Create hashed, expiring reset challenge; response never reveals account existence |
| POST | `/auth/reset-password` | Consume challenge and revoke existing sessions |
| GET | `/auth/me` | Current viewer projection |

## Profiles and search

| Method | Path | Purpose |
|---|---|---|
| GET | `/users/:username` | Privacy-aware public profile and relationship state |
| PATCH | `/me/profile` | Update display name, bio, avatar, interests, district |
| PATCH | `/me/privacy` | Update privacy controls |
| GET | `/users/search?q=&district=&interest=&cursor=` | Debounced, ranked user search |
| GET | `/users/:id/followers?cursor=` | Privacy-aware followers |
| GET | `/users/:id/following?cursor=` | Privacy-aware following |

## Social graph

| Method | Path | Purpose |
|---|---|---|
| POST | `/users/:id/follow` | Idempotent transactional follow; rejects self |
| DELETE | `/users/:id/follow` | Idempotent unfollow |
| POST | `/users/:id/friend-requests` | Send request after privacy checks |
| GET | `/me/friend-requests?status=` | Incoming/outgoing requests |
| PATCH | `/friend-requests/:id` | Accept or reject as receiver |
| DELETE | `/friend-requests/:id` | Cancel as sender |
| GET | `/me/friends?cursor=` | Friend list |
| DELETE | `/friends/:userId` | Remove canonical friendship |

## Buildings and world

| Method | Path | Purpose |
|---|---|---|
| GET | `/world` | Time/weather/events, plaza landmarks, district metadata |
| GET | `/world/buildings?x=&z=&radius=&cursor=` | Chunk-aware nearby building projections |
| GET | `/world/chunks/:chunkX/:chunkZ` | Cacheable chunk payload with ETag |
| GET | `/buildings/:id` | Building, owner summary, allowed interaction state |
| PATCH | `/buildings/:id` | Owner-only allowlisted customization |
| POST | `/buildings/:id/visit` | Privacy-checked, rate-limited visit record |
| POST | `/buildings/:id/favorite` | Favorite building |
| DELETE | `/buildings/:id/favorite` | Remove favorite |
| GET | `/me/favorites?cursor=` | Favorite buildings |
| GET | `/buildings/:id/interior` | Template and privacy-filtered gallery content |

## Discovery, notifications, and gamification

| Method | Path | Purpose |
|---|---|---|
| GET | `/trending?district=&window=24h` | Growth/engagement ranking, not follower totals |
| GET | `/leaderboard?metric=followers|visits|achievements` | Explicit metric leaderboard |
| GET | `/notifications?cursor=&unread=` | Viewer notification feed |
| PATCH | `/notifications/:id/read` | Mark owned notification read |
| POST | `/notifications/read-all` | Mark viewer feed read |
| GET | `/achievements` | Achievement catalog |
| GET | `/users/:id/achievements` | User badges |
| GET | `/dashboard` | Aggregated viewer analytics and recent activity |

## Administration

All endpoints require `ADMIN` or the documented moderation role in server middleware and service checks.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/stats` | Platform and online-user metrics |
| GET | `/admin/users?q=&status=&cursor=` | User administration |
| PATCH | `/admin/users/:id/status` | Suspend/reactivate account |
| GET | `/admin/reports` | Moderation queue |
| PATCH | `/admin/reports/:id` | Resolve report with audit actor |
| POST | `/admin/world-events` | Create event |
| PATCH | `/admin/world-events/:id` | Schedule/update/cancel event |

## Validation limits

Usernames are normalized lowercase and 3–32 safe characters; bios are at most 500 characters; interests come from normalized plain text limits; all UUIDs, cursors, coordinates, radii, asset IDs, and enums are server validated. World radius and page sizes are capped. Public serializers never return email, password/token hashes, private activity, or moderation data.
