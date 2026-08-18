import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("API foundation", () => {
  it("returns structured health status", async () => {
    const response = await request(createApp()).get("/api/health").expect(200);
    expect(response.body.data).toMatchObject({ status: "ok", service: "socialverse-api", version: "0.1.0" });
  });

  it("does not expose stack traces for missing routes", async () => {
    const response = await request(createApp()).get("/api/not-real").expect(404);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(response.text).not.toContain("at ");
  });

  it("protects authenticated endpoints", async () => {
    const response = await request(createApp()).get("/api/auth/me").expect(401);
    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });

  it("rejects malformed registration before database access", async () => {
    const response = await request(createApp()).post("/api/auth/register").send({
      email: "not-an-email", username: "bad name", displayName: "", password: "short",
    }).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("caps and validates spatial world queries before database access", async () => {
    const response = await request(createApp()).get("/api/world/buildings?x=0&z=0&radius=50000").expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("protects administration endpoints on the server", async () => {
    const response = await request(createApp()).get("/api/admin/stats").expect(401);
    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });
});
