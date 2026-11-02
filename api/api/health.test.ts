import { expect, describe, it } from "@jest/globals";
import { request } from "../test-utils.ts";

describe("GET /api/health", () => {
  it("reports the API and database as up", async () => {
    const res = await request("GET", "/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 200, db: "up" });
  });
});
