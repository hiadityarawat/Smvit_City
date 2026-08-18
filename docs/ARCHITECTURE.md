# Final architecture

## System shape

```text
Browser (React + R3F)
  ├─ REST /api/* ───────────────┐
  └─ Socket.IO /socket.io ──────┤
                                ▼
                     Express application
                     ├─ auth / users / social
                     ├─ world / buildings / search
                     ├─ notifications / events / admin
                     └─ realtime gateway
                                │
                    Prisma transactions and queries
                                │
                                ▼
                           PostgreSQL
```

The deployable units are a static client served by nginx, one stateless Node API, and PostgreSQL. When horizontal scale is required, Redis becomes the ephemeral presence store, Socket.IO adapter, rate-limit store, and hot chunk cache. Durable state remains in PostgreSQL.

## Boundaries

- `client`: browser UI, accessible non-3D routes, world renderer, local movement prediction, queries, and socket subscriptions.
- `server`: authentication, authorization, validation, privacy projection, social mutations, world allocation, ranking, moderation, and socket authority.
- `packages/shared`: serialization-safe contracts and constants; no database or UI imports.
- `server/prisma`: durable model and migrations; only services access Prisma.

## Intended feature layout

```text
client/src/
├── app/                  providers, router, error boundary
├── components/           accessible shared UI
├── features/
│   ├── auth/ profile/ search/ social/ notifications/
│   ├── dashboard/ settings/ admin/
│   └── building-customization/
├── world/
│   ├── scene/ player/ camera/ chunks/ buildings/
│   ├── multiplayer/ interactions/ interiors/ effects/
│   └── hud/ minimap/ performance/
├── api/ hooks/ stores/ types/ utils/

server/src/
├── modules/
│   ├── auth/ users/ profiles/ search/ follows/ friends/
│   ├── buildings/ world/ visits/ favorites/ trending/
│   ├── notifications/ achievements/ events/ admin/ reports/
│   └── each: controller, service, repository, validator, routes
├── middleware/ socket/ database/ config/ jobs/ utils/ types/
```

## Authentication and security

- Argon2id password hashing with server-selected cost parameters.
- Short-lived access JWT plus opaque rotating refresh token in `HttpOnly`, `SameSite=Lax`, secure production cookie.
- Only SHA-256 refresh/reset token hashes are stored. Token-family reuse revokes the family.
- Zod validates parameters, queries, and bodies. Prisma parameterization prevents SQL injection.
- Helmet, explicit CORS allowlist, small body limits, per-route rate limits, log redaction, and generic production errors are baseline middleware.
- Every protected service checks subject ownership/role. Admin moderation is enforced in the server, never inferred from UI visibility.
- User-generated content is plain text or allowlisted asset IDs/URLs. No custom HTML is accepted.
- Privacy projection happens before serialization and applies equally to REST and socket events.

## Scaling decisions

- API processes remain stateless; session state is refresh-token rows and later Redis presence.
- A building belongs to integer `chunkX/chunkZ`; chunk queries use indexed bounding boxes plus a radius filter.
- Clients maintain a bounded chunk cache and abort stale requests when crossing chunk boundaries.
- Social counts are derived from indexed relations. If scale requires counters, they become transactionally updated projections, never independent truth.
- Trending is a periodic materialized snapshot using bounded time windows, not an expensive live aggregate per request.
- Background jobs handle ranking, achievement evaluation, event transitions, notification fan-out, and stale-session cleanup.
- Observability target: structured logs, request IDs, health/readiness probes, OpenTelemetry traces, and metrics for request latency, socket population, chunk payloads, and database pool saturation.

## Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Thousands of meshes | chunking, instancing by archetype/material, three LOD bands, capped labels/avatars |
| Socket movement flood | 10–15 Hz client cap, transform thresholds, room scoping, server validation, client interpolation |
| Presence split-brain | Redis TTL heartbeats and multi-tab connection counts |
| Counter drift | relational truth plus transactionally refreshed projections and reconciliation jobs |
| Search growth | PostgreSQL trigram/GIN indexes first; external search only when measured |
| Hot central plaza | spatial Socket.IO rooms and separate landmark/static payload cache |
| Mobile thermal load | low preset, reduced DPR/distance, no shadows/weather, lightweight explore mode |
