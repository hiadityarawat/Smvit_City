import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ userCreate: vi.fn() }));

vi.mock("../../database/prisma.js", () => ({ prisma: { user: { create: database.userCreate } } }));

import { authService } from "./auth.service.js";

describe("account provisioning", () => {
  beforeEach(() => database.userCreate.mockReset());

  it("creates identity, profile, privacy, building, customization, and refresh session together", async () => {
    database.userCreate.mockResolvedValue({
      id: "059ff343-fb26-4693-9453-3ad4c811d9fd",
      email: "maya@example.com",
      username: "maya_codes",
      passwordHash: "stored-hash",
      role: "USER",
      status: "ACTIVE",
      createdAt: new Date("2026-08-18T00:00:00.000Z"),
      profile: { displayName: "Maya", avatarUrl: null, district: "NEWCOMER" },
      building: { id: "a90a9fa8-df0a-4a75-b32f-99bbbd6b6e46" },
    });

    const result = await authService.register({
      email: "maya@example.com", username: "maya_codes", displayName: "Maya", password: "SecureCity7Pass",
    });

    const call = database.userCreate.mock.calls[0]?.[0];
    expect(call.data.passwordHash).not.toBe("SecureCity7Pass");
    expect(call.data.profile.create).toMatchObject({ displayName: "Maya", district: "NEWCOMER" });
    expect(call.data.privacy.create).toEqual({});
    expect(call.data.building.create.customization.create).toEqual({});
    expect(call.data.refreshTokens.create.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.session.user).toMatchObject({ username: "maya_codes", displayName: "Maya", district: "NEWCOMER" });
    expect(result.refreshToken.length).toBeGreaterThan(32);
  });
});
