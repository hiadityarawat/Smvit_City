# SocialVerse — A Living Social City

SocialVerse is a full-stack social discovery platform presented as an explorable multiplayer 3D city. Every SocialVerse profile owns a building: follower count determines logarithmic height and architectural tier, following count affects the footprint, online presence illuminates windows, and account customization changes the building theme.

The current world is anchored at **Sir M. Visvesvaraya Institute of Technology, Bengaluru 562157** (`13.15135° N, 77.60904° E`) and includes a campus marker with a direct OpenStreetMap link.

## Highlights

- React Three Fiber city with smooth movement, running, jumping, collision boundaries, camera orbit, teleportation, and touch controls.
- Original red-and-black masked humanoid 3D avatar plus optimized remote-player representations and username labels.
- Brown/copper stepped building archetypes inspired by isometric city builders.
- Logarithmic follower scaling prevents unrealistic tower heights.
- Following count changes building width/depth, while follower milestones unlock houses, apartments, towers, and skyscrapers.
- Spatial world chunk API so the client never needs to load every citizen.
- Live Socket.IO presence, building illumination, multiplayer transforms, chunk rooms, throttling, and interpolation-ready state.
- Secure native authentication with Argon2id, short-lived JWT access tokens, rotating opaque refresh tokens, password reset, and protected routes.
- Profiles, search, follow graph, friendships, favorites, building visits, notifications, privacy settings, trending scores, achievements, dashboards, and server-enforced administration.
- Official OAuth adapter layer for GitHub, YouTube, Twitch, and Spotify.
- PostgreSQL relational model with Prisma migrations and deterministic demo data for 180 citizens.
- Dockerfiles and Docker Compose for the client, API, and PostgreSQL.
- Accessible non-3D routes for essential account and social actions.

## Technology

| Area | Stack |
|---|---|
| Web client | React 19, TypeScript, Vite, React Router |
| 3D world | Three.js, React Three Fiber, Drei |
| UI state/data | Zustand, TanStack Query, Axios |
| Styling/animation | Tailwind-compatible CSS architecture, Framer Motion, Lucide |
| API | Node.js, Express 5, TypeScript, Zod |
| Realtime | Socket.IO and Socket.IO Client |
| Database | PostgreSQL 17, Prisma ORM |
| Security | Argon2id, JWT, Helmet, CORS, rate limiting, secure cookies |
| Testing | Vitest, Testing Library, Supertest |
| Operations | Docker, Docker Compose, nginx, Pino logging |

## Repository structure

```text
socialverse/
├── client/
│   ├── src/
│   │   ├── api/                 Central authenticated HTTP client
│   │   ├── components/          Shared visual components
│   │   ├── features/auth/       Session bootstrap and protected routes
│   │   ├── pages/               Landing, world, dashboard, settings, admin
│   │   └── world/               Scene, avatars, buildings, controls, minimap
│   ├── Dockerfile
│   └── nginx.conf
├── server/
│   ├── prisma/
│   │   ├── migrations/          Versioned PostgreSQL migrations
│   │   ├── schema.prisma        Relational data model
│   │   └── seed.ts              Deterministic development city
│   └── src/
│       ├── config/              Validated environment and logging
│       ├── database/            Prisma lifecycle
│       ├── middleware/          Authentication, authorization, errors
│       ├── modules/             Domain-oriented REST services and routes
│       └── socket/              Presence and multiplayer gateway
├── packages/shared/             Browser/server contracts
├── docs/                        Architecture and protocol documentation
├── docker-compose.yml
└── .env.example
```

## Quick start with Docker

Requirements: Docker Desktop with Compose.

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Application: `http://localhost:5173`
- Public 3D preview: `http://localhost:5173/preview`
- API liveness: `http://localhost:4000/api/health`
- Database readiness: `http://localhost:4000/api/ready`

## Local development

Requirements: Node.js 22+, npm 10+, and PostgreSQL 16+.

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The development client runs on port `5173` and the Express/Socket.IO service runs on port `4000`.

## Environment configuration

Copy `.env.example` and replace every production secret. Never commit `.env`; it is excluded by `.gitignore`.

Core variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLIENT_ORIGIN` | Exact browser origin allowed by CORS |
| `API_PUBLIC_URL` | Public API origin used for OAuth callbacks |
| `ACCESS_TOKEN_SECRET` | Access-token signing secret, minimum 32 characters |
| `REFRESH_TOKEN_SECRET` | Refresh-session secret, minimum 32 characters |
| `OAUTH_STATE_SECRET` | Signs short-lived OAuth state |
| `INTEGRATION_TOKEN_SECRET` | Derives the AES-256-GCM provider-token key |
| `COOKIE_SECURE` | Must be `true` behind production HTTPS |

Optional official provider variables:

- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`

Providers without credentials remain visibly disabled instead of exposing a non-functional button.

## Official account integrations

The Settings page offers GitHub, YouTube, Twitch, and Spotify connections using official authorization-code flows and minimal read-only scopes. OAuth state is signed and expires after ten minutes. Access and refresh tokens are encrypted with AES-256-GCM before database storage and are never returned to the browser.

Register callback URLs in the provider consoles using:

```text
<API_PUBLIC_URL>/api/integrations/github/callback
<API_PUBLIC_URL>/api/integrations/youtube/callback
<API_PUBLIC_URL>/api/integrations/twitch/callback
<API_PUBLIC_URL>/api/integrations/spotify/callback
```

Spotify local development requires an explicit loopback IP such as `http://127.0.0.1:4000`; it does not accept `localhost` as a redirect host.

Instagram is intentionally not connected through a private, scraped, deprecated, or generic API. A future Meta integration must use the exact approved Instagram product and pass the corresponding Meta app review.

## 3D world model

### Building dimensions

Follower count controls height using logarithmic normalization:

```text
height = clamp(6 + log10(followers + 1) × 7, 6, 48)
```

Following count controls footprint using a separate logarithmic scale. This communicates two statistics without letting either produce impossible geometry.

Architectural milestones:

- Under 100 followers: shop/house massing.
- 100–1,000: larger residence or compact apartment.
- 1,000–10,000: stepped apartment building.
- 10,000–100,000: multi-tier tower.
- 100,000+: capped skyscraper with a roof spire.

Online buildings use warm illuminated windows; offline buildings retain dark window bands. The brown, terracotta, copper, and tan material family keeps the campus visually consistent.

### Controls

- `WASD` or arrow keys: move
- `Shift`: run
- `Space`: jump
- Mouse/touch drag: orbit camera
- Wheel/pinch: zoom
- Select a building: open the citizen card
- “Take me there”: teleport beside the selected building

### Campus location

The procedural social district uses Sir MVIT as its real-world geographic anchor. The HUD and minimap display the campus coordinate, and the location control opens the verified point in OpenStreetMap. The 3D building lots are a social visualization, not a cadastral or navigation-accurate reconstruction of physical campus buildings.

## REST API overview

All API responses use `{ data, meta? }`; errors use `{ error: { code, message, details? } }`.

Major route groups:

- `/api/auth` — register, login, refresh, logout, password reset
- `/api/users` — profiles, privacy-aware search, settings
- `/api/users/:id/follow` — follow graph
- `/api/friends` — friend requests and friendships
- `/api/notifications` — notification inbox and read state
- `/api/buildings` — lookup, visits, favorites, customization, interiors
- `/api/world` — world state and spatial building queries
- `/api/trending`, `/api/leaderboard` — discovery ranking
- `/api/integrations` — official provider connection lifecycle
- `/api/admin` — role-protected platform operations

See [docs/API.md](docs/API.md) for the complete contract.

## WebSocket overview

The authenticated Socket.IO gateway provides:

- presence join/leave and multi-tab connection counting
- online building state changes
- player position, rotation, and movement state
- chunk-room subscriptions
- rate-limited transform validation
- real-time notifications and world-event broadcasts

See [docs/WEBSOCKETS.md](docs/WEBSOCKETS.md) for event payloads.

## Security

- Argon2id password hashing; plaintext passwords are never stored.
- Short-lived signed access tokens and rotating opaque refresh tokens.
- Refresh-family reuse detection and revocation.
- HttpOnly refresh cookies with production `Secure` support.
- Server-side validation with Zod and centralized safe errors.
- Server-enforced roles and privacy rules.
- Helmet headers, explicit CORS, body limits, and route rate limits.
- Prisma parameterization and relational constraints.
- OAuth state validation and encrypted provider credentials.
- No secrets embedded in client bundles.
- `.env`, dependency folders, compiled output, logs, and coverage are excluded from Git.

## Data model

Important models include `User`, `Profile`, `PrivacySettings`, `Building`, `BuildingCustomization`, `Follow`, `FriendRequest`, `Friendship`, `Notification`, `Achievement`, `UserAchievement`, `BuildingVisit`, `Favorite`, `RefreshToken`, `PasswordResetToken`, `SocialAccount`, `TrendingSnapshot`, `WorldEvent`, `WorldState`, and `Report`.

Follower/following values shown in the world are derived from `Follow` relations, preventing denormalized counters from becoming authoritative or inconsistent.

## Seed data

```bash
npm run db:seed
```

The deterministic seed creates 180 synthetic citizens with buildings, districts, interests, relationships, achievements, world state, and trending snapshots. It never scrapes Instagram or another external social network.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The test suite covers authentication primitives, API validation and errors, authorization boundaries, social rules, OAuth-state integrity, provider-token encryption, and key frontend routes. Purely visual Three.js details are verified through production builds and local browser inspection.

## Production deployment checklist

1. Replace all development secrets with independently generated values.
2. Provision PostgreSQL and run `npm run db:generate` plus Prisma deployment migrations.
3. Set exact HTTPS client/API origins and enable secure cookies.
4. Register provider apps and exact OAuth callbacks.
5. Configure transactional email and an object-storage/CDN provider.
6. Run type checking, lint, tests, and the production build.
7. Run database, Socket.IO multi-client, accessibility, container, and load smoke tests in the target environment.
8. Add Redis-compatible Socket.IO coordination before horizontal API scaling.
9. Monitor errors, latency, WebSocket connection counts, and world-chunk query performance.

## Further documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database design](docs/DATABASE.md)
- [REST API](docs/API.md)
- [WebSocket events](docs/WEBSOCKETS.md)
- [3D world architecture](docs/WORLD.md)
- [Roadmap and dependencies](docs/ROADMAP.md)
- [Authentication operations](docs/PHASE2.md)
- [Current implementation status](docs/STATUS.md)

## License
hello
No open-source license has been selected yet. Until a license is added, all rights remain with the repository owner.