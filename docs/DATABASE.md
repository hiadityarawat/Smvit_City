# Database design

The executable design is [the Prisma schema](../server/prisma/schema.prisma). PostgreSQL is the source of truth; online player transforms remain ephemeral.

## Main aggregates

- Identity: `User`, `Profile`, `PrivacySettings`, `RefreshToken`, `PasswordResetToken`, `SocialAccount`.
- Social graph: `Follow`, `FriendRequest`, canonicalized `Friendship`, `Notification`.
- City: `Building`, allowlisted `BuildingCustomization`, `BuildingVisit`, `Favorite`, `UserDistrictVisit`.
- Content/gamification: `Post`, `Achievement`, `UserAchievement`, `TrendingSnapshot`.
- Operations: `WorldEvent`, singleton `WorldState`, `Report`.

## Invariants

- `Follow(followerId, followingId)` is the primary key, so duplicate follows are impossible. The service rejects self-following in the same transaction.
- Follower/following totals are counts over `Follow`; they are not duplicated on `User` or `Profile`.
- Every user can own at most one building and every coordinate pair is unique.
- Favorites and user achievements use composite keys, preventing duplicates.
- Friendship services sort UUIDs into `userAId < userBId` before insert; the unique pair then prevents duplicates.
- Refresh tokens are hashed, expiring, revocable, and grouped into rotation families.
- Hard user deletion cascades private owned data; actor/visitor/audit references that can remain anonymous use `SetNull`.
- Privacy defaults are conservative-but-social and are evaluated by server query projections.

## Spatial model

World allocation stores floating-point `x/z` for rendering and computed integer `chunkX/chunkZ` for lookup. The first implementation uses a 128-world-unit chunk. A request computes intersecting chunks, queries the composite index, then applies bounds/radius and a hard result limit. At very large scale this can migrate to PostGIS without changing the client contract.

## Search and ranking

Initial prefix/contains search uses indexed username/display name/district columns. The first production migration should enable `pg_trgm` and add GIN trigram indexes after verifying hosting support. `TrendingSnapshot` stores explainable inputs for a rolling window so results are fast and auditable.

## Migrations and seeds

Committed Prisma migrations are deployed with `prisma migrate deploy`; Phase 1 includes the initial forward-schema migration. Phase 2 adds authentication integration tests around transactional user provisioning. Phase 11 adds a deterministic 100–500 user seed using generated SocialVerse-native data only.
