export interface WorldBuilding {
  id: string; ownerId: string; username: string; displayName: string; avatarUrl: string | null; district: string;
  x: number; z: number; chunkX: number; chunkZ: number; level: number; style: string; height: number;
  followerCount: number | null; followingCount: number | null; online: boolean; customization: { theme?: string } | null;
}
