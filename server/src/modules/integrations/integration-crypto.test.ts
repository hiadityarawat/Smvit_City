import { describe, expect, it } from "vitest";
import { createOAuthState, decryptSecret, encryptSecret, verifyOAuthState } from "./integration-crypto.js";

describe("official integration security", () => {
  it("encrypts provider tokens with authenticated encryption", () => {
    const cipher = encryptSecret("provider-access-token");
    expect(cipher).not.toContain("provider-access-token");
    expect(decryptSecret(cipher)).toBe("provider-access-token");
  });

  it("signs OAuth state and rejects tampering", () => {
    const state = createOAuthState("user-id", "github");
    expect(verifyOAuthState(state)).toMatchObject({ userId: "user-id", provider: "github" });
    expect(() => verifyOAuthState(`${state.slice(0, -1)}x`)).toThrow();
  });
});
