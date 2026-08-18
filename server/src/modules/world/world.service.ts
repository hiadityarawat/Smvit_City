import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";
import { AppError } from "../../utils/app-error.js";

const buildingProjection = {
  id: true, userId: true, district: true, x: true, z: true, chunkX: true, chunkZ: true, level: true, style: true, visitCount: true,
  customization: true,
  user: { select: { username: true, lastActiveAt: true, profile: true, privacy: true, _count: { select: { followsReceived: true, followsGiven: true } } } },
} satisfies Prisma.BuildingSelect;

function height(followers: number) { return Math.min(48, Math.max(6, 6 + Math.log10(followers + 1) * 7)); }
function project(building: Prisma.BuildingGetPayload<{ select: typeof buildingProjection }>) {
  const followers = building.user._count.followsReceived;
  return { id: building.id, ownerId: building.userId, username: building.user.username, displayName: building.user.profile!.displayName, avatarUrl: building.user.profile!.avatarUrl, district: building.district, x: building.x, z: building.z, chunkX: building.chunkX, chunkZ: building.chunkZ, level: building.level, style: building.style, height: height(followers), followerCount: building.user.privacy!.showFollowerInformation ? followers : null, followingCount: building.user.privacy!.showFollowerInformation ? building.user._count.followsGiven : null, online: false, customization: building.customization };
}

export const worldService = {
  async state() {
    const [state, events] = await prisma.$transaction([
      prisma.worldState.findUnique({ where: { id: "primary" } }),
      prisma.worldEvent.findMany({ where: { status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } }),
    ]);
    return { timeScale: state?.timeScale ?? 1, timeOffset: state?.timeOffset ?? 0, weather: state?.weather ?? "CLEAR", weatherSeed: state?.weatherSeed ?? 1, events, districts: ["DEVELOPER", "CREATOR", "GAMING", "MUSIC", "SPORTS", "TRENDING", "NEWCOMER"], plaza: { x: 0, z: 0 } };
  },
  async nearby(x: number, z: number, radius: number, limit: number) {
    const buildings = await prisma.building.findMany({ where: { x: { gte: x - radius, lte: x + radius }, z: { gte: z - radius, lte: z + radius } }, select: buildingProjection, take: limit });
    return buildings.filter((building) => Math.hypot(building.x - x, building.z - z) <= radius).map(project);
  },
  async chunk(chunkX: number, chunkZ: number) { return (await prisma.building.findMany({ where: { chunkX, chunkZ }, select: buildingProjection, take: 500 })).map(project); },
  async building(id: string) { const building = await prisma.building.findUnique({ where: { id }, select: buildingProjection }); if (!building) throw new AppError(404, "BUILDING_NOT_FOUND", "That building was not found."); return project(building); },
  async customize(userId: string, id: string, data: Prisma.BuildingCustomizationUpdateInput) { const building = await prisma.building.findUnique({ where: { id }, select: { userId: true } }); if (!building) throw new AppError(404, "BUILDING_NOT_FOUND", "That building was not found."); if (building.userId !== userId) throw new AppError(403, "BUILDING_OWNERSHIP_REQUIRED", "Only the building owner can customize it."); return prisma.buildingCustomization.update({ where: { buildingId: id }, data }); },
  async visit(visitorId: string, id: string) { const building = await prisma.building.findUnique({ where: { id }, include: { user: { include: { privacy: true } } } }); if (!building) throw new AppError(404, "BUILDING_NOT_FOUND", "That building was not found."); if (!building.user.privacy?.allowBuildingVisits && visitorId !== building.userId) throw new AppError(403, "BUILDING_VISITS_DISABLED", "This building is not accepting visitors."); await prisma.$transaction([prisma.buildingVisit.create({ data: { buildingId: id, visitorId } }), prisma.building.update({ where: { id }, data: { visitCount: { increment: 1 } } }), ...(visitorId !== building.userId ? [prisma.notification.create({ data: { recipientId: building.userId, actorId: visitorId, type: "BUILDING_VISIT" as const, title: "Building visitor", body: "Someone explored your building." } })] : [])]); return { visited: true }; },
  async favorite(userId: string, id: string) { try { await prisma.favorite.create({ data: { userId, buildingId: id } }); } catch (error) { if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error; } return { favorite: true }; },
  async unfavorite(userId: string, id: string) { await prisma.favorite.deleteMany({ where: { userId, buildingId: id } }); return { favorite: false }; },
  async favorites(userId: string) { const rows = await prisma.favorite.findMany({ where: { userId }, include: { building: { select: buildingProjection } }, orderBy: { createdAt: "desc" }, take: 100 }); return rows.map((row) => project(row.building)); },
};
