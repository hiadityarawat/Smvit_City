# WebSocket event design

Socket.IO uses the same authenticated session as REST. Unauthenticated transports can receive only public world state; presence and movement require an active user. Payloads are schema-validated and events are rate-limited.

## Rooms

- `user:{userId}`: private notifications/session events across that user’s tabs.
- `chunk:{x}:{z}`: movement, presence, and building state near the player.
- `district:{district}`: district events and decorations.
- `world`: global event transitions only.

## Client → server

| Event | Payload | Policy |
|---|---|---|
| `presence:join` | `{ chunkX, chunkZ }` | Auth required; server owns online truth |
| `presence:heartbeat` | `{ sequence }` | 20s cadence; refreshes TTL |
| `world:subscribe` | `{ chunks: [{ x, z }] }` | Bounded set, replaces prior subscriptions |
| `player:move` | `{ x, y, z, rotationY, movement, sequence, sentAt }` | Max 15 Hz, thresholded, bounded speed/position |
| `player:teleport` | `{ buildingId }` | Server resolves allowed destination/cooldown |
| `typing:*` | Not planned | SocialVerse has no chat in the initial scope |

## Server → client

| Event | Payload | Purpose |
|---|---|---|
| `system:ready` | `{ version, timestamp }` | Transport readiness (implemented) |
| `presence:snapshot` | `{ users: Presence[] }` | Initial room state |
| `presence:changed` | `{ userId, online, lastSeen? }` | Privacy-aware presence change |
| `building:presence` | `{ buildingId, illuminated }` | Decouples identity privacy from visual light state |
| `player:joined` | `RemotePlayer` | Spawn remote avatar |
| `player:moved` | `RemoteTransform` | Sequence-numbered transform |
| `player:left` | `{ userId }` | Remove avatar after grace period |
| `player:teleport-approved` | `{ position, rotationY, transitionId }` | Smooth client transition target |
| `notification:created` | `NotificationSummary` | Private realtime notification |
| `notification:read` | `{ id, readAt }` | Multi-tab synchronization |
| `world:event-changed` | `WorldEventSummary` | Event decorations/state |
| `world:weather-changed` | `{ weather, seed, transitionMs }` | Deterministic lightweight weather |
| `session:revoked` | `{ reason }` | Force sign-out/re-authentication |

## Movement protocol

Clients predict their own character and transmit only after a position/rotation threshold or movement-state change, capped at 10–15 Hz. The server checks monotonic sequence, finite values, world bounds, maximum plausible displacement, and teleport authorization. It broadcasts to intersecting chunk rooms without echoing to the sender. Receivers buffer roughly 100 ms and interpolate; brief packet gaps extrapolate with a strict cap. Transforms are never written to PostgreSQL per packet.

## Presence lifecycle

A future Redis adapter stores `{ userId → connection count, last heartbeat, chunk }` with TTL. Multiple tabs keep one user online until the last connection leaves. Disconnect has a short grace period to mask network changes. On final disconnect PostgreSQL `lastActiveAt` is updated once and privacy-filtered change events are sent.
