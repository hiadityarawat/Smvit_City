import { Prisma, type District } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";

const profileInclude = {
  profile: true, privacy: true, building: { include: { customization: true } },
  achievements: { include: { achievement: true }, orderBy: { unlockedAt: "desc" as const }, take: 12 },
  _count: { select: { followsReceived: true, followsGiven: true, posts: true } },
} satisfies Prisma.UserInclude;

export const usersService = {
  async profile(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({ where: { username }, include: profileInclude });
    if (!user || user.status !== "ACTIVE" || !user.profile || !user.privacy || !user.building) throw new AppError(404, "USER_NOT_FOUND", "That SocialVerse user was not found.");
    const owner = viewerId === user.id;
    const relationship = viewerId ? await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } }, select: { createdAt: true } }) : null;
    return {
      id: user.id, username: user.username, displayName: user.profile.displayName, bio: user.profile.bio, avatarUrl: user.profile.avatarUrl,
      interests: user.profile.interests, district: user.profile.district, createdAt: user.createdAt,
      followers: owner || user.privacy.showFollowerInformation ? user._count.followsReceived : null,
      following: owner || user.privacy.showFollowerInformation ? user._count.followsGiven : null,
      posts: user._count.posts, lastSeen: owner || user.privacy.showLastSeen ? user.lastActiveAt : null,
      followedByViewer: Boolean(relationship),
      building: { id: user.building.id, level: user.building.level, style: user.building.style, district: user.building.district, x: user.building.x, z: user.building.z, customization: user.building.customization },
      achievements: user.achievements.map((entry) => ({ ...entry.achievement, unlockedAt: entry.unlockedAt })),
    };
  },

  async search(input: { q: string; district?: District; interest?: string; cursor?: string; limit: number }) {
    const where: Prisma.UserWhereInput = {
      status: "ACTIVE",
      ...(input.cursor ? { id: { gt: input.cursor } } : {}),
      profile: {
        ...(input.district ? { district: input.district } : {}),
        ...(input.interest ? { interests: { has: input.interest } } : {}),
        ...(input.q ? { OR: [
          { displayName: { contains: input.q, mode: "insensitive" } },
          { interests: { has: input.q.toLowerCase() } },
        ] } : {}),
      },
      ...(input.q ? { OR: [
        { username: { contains: input.q, mode: "insensitive" } },
        { profile: { displayName: { contains: input.q, mode: "insensitive" } } },
        { profile: { interests: { has: input.q.toLowerCase() } } },
      ] } : {}),
    };
    const users = await prisma.user.findMany({
      where, orderBy: { id: "asc" }, take: input.limit + 1,
      select: { id: true, username: true, profile: true, privacy: true, building: { select: { id: true } }, _count: { select: { followsReceived: true } } },
    });
    const hasMore = users.length > input.limit; const page = users.slice(0, input.limit);
    return {
      items: page.map((user) => ({ id: user.id, username: user.username, displayName: user.profile!.displayName, avatarUrl: user.profile!.avatarUrl, district: user.profile!.district, interests: user.profile!.interests, followerCount: user.privacy!.showFollowerInformation ? user._count.followsReceived : null, buildingId: user.building!.id })),
      nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
    };
  },

  updateProfile(userId: string, data: Prisma.ProfileUpdateInput) {
    return prisma.profile.update({ where: { userId }, data, select: { displayName: true, bio: true, avatarUrl: true, interests: true, district: true, updatedAt: true } });
  },

  updatePrivacy(userId: string, data: Prisma.PrivacySettingsUpdateInput) {
    return prisma.privacySettings.update({ where: { userId }, data });
  },
};
