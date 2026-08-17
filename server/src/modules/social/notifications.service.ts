import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";

export const notificationsService = {
  async list(userId: string, unreadOnly = false) { const [items, unread] = await prisma.$transaction([prisma.notification.findMany({ where: { recipientId: userId, ...(unreadOnly ? { readAt: null } : {}) }, orderBy: { createdAt: "desc" }, take: 50, include: { actor: { include: { profile: true } } } }), prisma.notification.count({ where: { recipientId: userId, readAt: null } })]); return { items, unread }; },
  async read(userId: string, id: string) { const updated = await prisma.notification.updateMany({ where: { id, recipientId: userId }, data: { readAt: new Date() } }); if (!updated.count) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "That notification was not found."); return { read: true }; },
  async readAll(userId: string) { const result = await prisma.notification.updateMany({ where: { recipientId: userId, readAt: null }, data: { readAt: new Date() } }); return { updated: result.count }; },
};
