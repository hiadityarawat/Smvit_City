# Phase 2 verification and operations

## Implemented

- Registration normalizes and validates identity input, hashes passwords with Argon2id, and creates user, profile, privacy settings, allocated building/customization, and first refresh session through one nested Prisma write.
- Login uses a generic credential failure, account-status enforcement, and a fresh token family.
- Access tokens are short-lived HS256 JWTs with issuer, audience, role, username, subject, and explicit access-token type.
- Refresh sessions use high-entropy opaque `HttpOnly`, `SameSite=Lax` cookies. Only secret-peppered SHA-256 hashes are stored. Every refresh rotates the token; reuse revokes the family.
- Password reset uses single-use expiring opaque tokens, changes the password transactionally, and revokes every active session.
- Browser access tokens live only in memory. Startup restores from the refresh cookie, and the HTTP client performs one refresh/retry on access expiration.
- `/app` is a genuine protected route and exposes only completed Phase 2 account state.

## Production configuration

Replace both token secrets with independent random values of at least 32 characters, set `COOKIE_SECURE=true` behind HTTPS, keep `CLIENT_ORIGIN` exact, and configure an email delivery adapter for password resets. Development logs a reset URL for local testing; production never logs the reset token and emits an operator warning until an adapter is connected.

## Validation boundary

Strict type checks, lint, unit/HTTP tests, builds, Prisma generation, and an API health smoke check run locally. This workstation has no PostgreSQL or Docker, so migration deployment and database-backed auth integration must run with `docker compose up --build` on a Docker-capable host before production deployment.
