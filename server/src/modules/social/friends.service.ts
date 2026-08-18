import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";

function canonicalPair(one: string, two: string) { return one < two ? { userAId: one, userBId: two } : { userAId: two, userBId: one }; }

export const friendsService = {
  async request(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new AppError(400, "SELF_FRIEND_FORBIDDEN", "You cannot send yourself a friend request.");
    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, include: { privacy: true } });
    if (!receiver || receiver.status !== "ACTIVE") throw new AppError(404, "USER_NOT_FOUND", "That user was not found.");
    if (!receiver.privacy?.allowFriendRequests) throw new AppError(403, "FRIEND_REQUESTS_DISABLED", "This user is not accepting friend requests.");
    const pair = canonicalPair(senderId, receiverId);
    if (await prisma.friendship.findUnique({ where: { userAId_userBId: pair } })) throw new AppError(409, "ALREADY_FRIENDS", "You are already friends.");
    try {
      return await prisma.$transaction(async (transaction) => {
        const request = await transaction.friendRequest.upsert({
          where: { senderId_receiverId: { senderId, receiverId } },
          update: { status: "PENDING" }, create: { senderId, receiverId },
        });
        await transaction.notification.create({ data: { recipientId: receiverId, actorId: senderId, type: "FRIEND_REQUEST", title: "Friend request", body: "Someone wants to explore SocialVerse with you." } });
        return request;
      });
    } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError(409, "REQUEST_EXISTS", "A friend request already exists."); throw error; }
  },
  async respond(userId: string, requestId: string, accept: boolean) {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== userId || request.status !== "PENDING") throw new AppError(404, "FRIEND_REQUEST_NOT_FOUND", "That pending request was not found.");
    return prisma.$transaction(async (transaction) => {
      await transaction.friendRequest.update({ where: { id: requestId }, data: { status: accept ? "ACCEPTED" : "REJECTED" } });
      if (!accept) return { accepted: false };
      await transaction.friendship.upsert({ where: { userAId_userBId: canonicalPair(request.senderId, request.receiverId) }, update: {}, create: canonicalPair(request.senderId, request.receiverId) });
      await transaction.notification.create({ data: { recipientId: request.senderId, actorId: userId, type: "FRIEND_ACCEPTED", title: "Friend request accepted", body: "You have a new friend in the city." } });
      return { accepted: true };
    });
  },
  async remove(userId: string, friendId: string) { await prisma.friendship.deleteMany({ where: { OR: [{ userAId: userId, userBId: friendId }, { userAId: friendId, userBId: userId }] } }); return { removed: true }; },
  async requests(userId: string) { return prisma.friendRequest.findMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] }, include: { sender: { include: { profile: true } }, receiver: { include: { profile: true } } }, orderBy: { createdAt: "desc" }, take: 100 }); },
  async list(userId: string) { const rows = await prisma.friendship.findMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] }, include: { userA: { include: { profile: true } }, userB: { include: { profile: true } } }, take: 100 }); return rows.map((row) => { const user = row.userAId === userId ? row.userB : row.userA; return { id: user.id, username: user.username, displayName: user.profile!.displayName, avatarUrl: user.profile!.avatarUrl }; }); },
};
