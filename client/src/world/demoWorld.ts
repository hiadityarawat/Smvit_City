import type { WorldBuilding } from "./types";

const districts = ["DEVELOPER", "CREATOR", "GAMING", "MUSIC", "SPORTS", "TRENDING", "NEWCOMER"];
export const demoBuildings: WorldBuilding[] = Array.from({ length: 90 }, (_, index) => {
  const row = Math.floor(index / 10); const column = index % 10; const x = (column - 4.5) * 28; const z = (row - 4.5) * 30 + (row >= 5 ? 32 : -32);
  const followers = Math.round(Math.pow((index * 7919) % 1000, 1.7));
  const following = 40 + (index * 137) % 9_000;
  return { id: `demo-${index}`, ownerId: `demo-owner-${index}`, username: `citizen_${String(index + 1).padStart(3, "0")}`, displayName: ["Maya Chen", "Arjun Vale", "Nora Pixel", "Leo Rhythm"][index % 4]!, avatarUrl: null, district: districts[index % districts.length]!, x, z, chunkX: Math.floor(x / 128), chunkZ: Math.floor(z / 128), level: 1 + index % 8, style: followers > 80_000 ? "SKYSCRAPER" : followers > 10_000 ? "TOWER" : followers > 1_000 ? "APARTMENT" : "HOUSE", height: Math.min(48, 6 + Math.log10(followers + 1) * 7), followerCount: followers, followingCount: following, online: index % 7 === 0, customization: { theme: ["MIDNIGHT", "AURORA", "SUNSET", "FOREST"][index % 4]! } };
});
