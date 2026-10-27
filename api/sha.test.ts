import { describe } from "@jest/globals";
import { sha256 } from "./sha.ts";

describe("SHA-256", () => {
  test("should return the same hash for the same input", async () => {
    const input = "hello world";
    const hash1 = await sha256(input);
    const hash2 = await sha256(input);
    const hash3 = await sha256(input);
    expect(hash1).toBe(hash2);
    expect(hash1).toBe(hash3);
  });

  test("should return different hashes for different inputs", async () => {
    const input1 = "hello world";
    const input2 = "world hello";
    const hash1 = await sha256(input1);
    const hash2 = await sha256(input2);
    expect(hash1).not.toBe(hash2);
  });

  test("should return a 256 bit hex string", async () => {
    const input = "hello world";
    const hash = await sha256(input);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-fA-F]{64}$/);
  });
});
