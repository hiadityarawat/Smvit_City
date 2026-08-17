const CHUNK_SIZE = 128;
const LOT_SPACING = 18;

export function randomBuildingLot() {
  let x = 0; let z = 0;
  do {
    x = (Math.floor(Math.random() * 81) - 40) * LOT_SPACING;
    z = (Math.floor(Math.random() * 81) - 40) * LOT_SPACING;
  } while (Math.abs(x) < 90 && Math.abs(z) < 90);
  return { x, z, chunkX: Math.floor(x / CHUNK_SIZE), chunkZ: Math.floor(z / CHUNK_SIZE) };
}
