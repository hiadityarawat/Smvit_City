# Development roadmap and dependencies

Each phase ends with type checks, focused tests, production builds, database migration verification, and client/API integration checks. Features are not surfaced in navigation until their action path works.

## Phases

1. **Foundation — implemented:** workspaces, strict TypeScript, React/Vite shell, Three.js preview, Express API, Socket.IO transport, Prisma schema, PostgreSQL/Docker topology, security/error baseline, health tests, documentation.
2. **Authentication — implemented:** transactional register/profile/privacy/building/session provisioning; Argon2id; rotating cookie sessions with reuse detection; login/logout/refresh/reset architecture; protected routes, browser flows, and locally runnable security/HTTP tests. PostgreSQL integration awaits a Docker-capable host.
3. **Social backend — implemented:** profile/privacy serializers, search, follow graph, friends, notifications, favorites, visits, discovery, and relational constraints.
4. **Basic 3D world — functional slice:** R3F scene, road/plaza grid, player/camera/input/collision, loading and offline states. Graphics-preset controls remain.
5. **Database → city — functional slice:** lot allocator, 180-user generated seed, spatial chunk APIs, logarithmic tiers. Instancing/LOD remains.
6. **Interactions — functional slice:** building selection, working follow/favorite/teleport, search locate, minimap, and interiors. Route visualization remains optional.
7. **Realtime — functional slice:** authenticated sockets, multi-tab presence, chunk rooms, building illumination, throttled validated movement, remote avatars, and reconnect transport. Redis horizontal scaling remains.
8. **Advanced world — in progress:** themed district colors, minimap, reusable interiors, day/night, achievement/event APIs. Weather visuals, event decorations, and automatic achievement evaluation remain.
9. **Dashboard/admin — in progress:** dashboard aggregation, settings/customization, notifications, admin stats/users/reports/event APIs and role guards. Rich charts and full moderation editors remain.
10. **Optimization — in progress:** lazy world bundle, capped spatial loading and chunk-relative query cache are present. Measured LOD, instancing, compressed assets, Redis, and load tests remain.
11. **Testing/documentation — in progress:** focused backend/frontend suites, 180-user seed, API and architecture docs are present. PostgreSQL/container, socket, accessibility, and load suites remain.

## Required dependencies

### Client

- Runtime: React, React DOM, React Router, Three.js, React Three Fiber, Drei, Framer Motion, Zustand, TanStack Query, Axios, Socket.IO Client, Lucide.
- Styling/build: Vite, TypeScript, Tailwind CSS, Tailwind Vite plugin.
- Tests/quality: Vitest, Testing Library, jsdom, ESLint, TypeScript ESLint.
- Later when used: `@react-three/rapier` for collision/physics, `react-hook-form` plus Zod resolver, a small toast library, Recharts, and axe-core.

### Server

- Runtime: Express, Prisma Client, Socket.IO, Zod, Argon2, JSON Web Token, cookie-parser, Helmet, CORS, express-rate-limit, Pino/Pino HTTP, dotenv.
- Tooling: Prisma CLI, TypeScript, tsx, Vitest, Supertest, ESLint, TypeScript ESLint.
- Scale additions only when the phase needs them: Redis client, Socket.IO Redis adapter, BullMQ for jobs, OpenTelemetry, Prometheus metrics, and S3-compatible object storage SDK.

### Infrastructure

- Node.js 22 LTS-compatible runtime, PostgreSQL 17 container, nginx static client image, Docker Compose.
- CI target: install from lockfile, Prisma validate/generate, typecheck, test, build, container build, migration smoke test.

Versions are pinned by `package-lock.json`; optional future packages are not installed until exercised by code.
