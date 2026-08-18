import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";

export const followsService = {
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new AppError(400, "SELF_FOLLOW_FORBIDDEN", "You cannot follow yourself.");
    const target = await prisma.user.findUnique({ where: { id: followingId }, select: { id: true, username: true, status: true } });
    if (!target || target.status !== "ACTIVE") throw new AppError(404, "USER_NOT_FOUND", "That user was not found.");
    try {
      await prisma.$transaction([
        prisma.follow.create({ data: { followerId, followingId } }),
        prisma.notification.create({ data: { recipientId: followingId, actorId: followerId, type: "FOLLOW", title: "New follower", body: "Someone new is following your city journey." } }),
      ]);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    }
    return { following: true };
  },
  async unfollow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new AppError(400, "SELF_FOLLOW_FORBIDDEN", "You cannot unfollow yourself.");
    await prisma.follow.deleteMany({ where: { followerId, followingId } }); return { following: false };
  },
  async list(userId: string, direction: "followers" | "following", viewerId: string, cursor?: string, limit = 20) {
    if(userId!==viewerId){const privacy=await prisma.privacySettings.findUnique({where:{userId},select:{showFollowerInformation:true}});if(!privacy?.showFollowerInformation)throw new AppError(403,"FOLLOW_GRAPH_PRIVATE","This user's follow information is private.");}
    const rows = await prisma.follow.findMany({
      where: direction === "followers" ? { followingId: userId } : { followerId: userId },
      ...(cursor ? { cursor: { followerId_followingId: direction === "followers" ? { followerId: cursor, followingId: userId } : { followerId: userId, followingId: cursor } }, skip: 1 } : {}),
      take: limit + 1, orderBy: { createdAt: "desc" },
      include: { follower: { include: { profile: true } }, following: { include: { profile: true } } },
    });
    const page = rows.slice(0, limit); const hasMore = rows.length > limit;
    return { items: page.map((row) => { const user = direction === "followers" ? row.follower : row.following; return { id: user.id, username: user.username, displayName: user.profile!.displayName, avatarUrl: user.profile!.avatarUrl }; }), nextCursor: hasMore ? (direction === "followers" ? page.at(-1)?.followerId : page.at(-1)?.followingId) ?? null : null };
  },
};
