import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";
import { createAccessToken, createOpaqueToken, hashOpaqueToken, verifyAccessToken } from "./tokens.js";
import { randomBuildingLot } from "./building-allocation.js";

describe("authentication security primitives", () => {
  it("hashes and verifies passwords without retaining plaintext", async () => {
    const password = "CorrectHorse7Battery";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(hash, password)).toBe(true);
    expect(await verifyPassword(hash, "Incorrect7Password")).toBe(false);
  });

  it("creates scoped access tokens", () => {
    const token = createAccessToken({ id: "9bb5a40a-4889-4dc7-a9af-5b94f54ee8fa", username: "nova", role: "USER" });
    expect(verifyAccessToken(token)).toMatchObject({ sub: "9bb5a40a-4889-4dc7-a9af-5b94f54ee8fa", username: "nova", role: "USER", type: "access" });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow();
  });

  it("stores only deterministic hashes of high-entropy opaque tokens", () => {
    const token = createOpaqueToken();
    expect(token.length).toBeGreaterThan(32);
    expect(hashOpaqueToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
    expect(hashOpaqueToken(token)).not.toContain(token);
  });

  it("allocates buildings on chunk-addressable lots", () => {
    const lot = randomBuildingLot();
    expect(Math.abs(lot.x % 18)).toBe(0);
    expect(Math.abs(lot.z % 18)).toBe(0);
    expect(lot.chunkX).toBe(Math.floor(lot.x / 128));
    expect(lot.chunkZ).toBe(Math.floor(lot.z / 128));
  });
});
