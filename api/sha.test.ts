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

  test.each([
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["hello world", "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"],
  ])("should match the known hash of %p", async (input, expected) => {
    expect(await sha256(input)).toBe(expected);
  });

  test("should hash characters outside ASCII as UTF-8", async () => {
    // The same value from `printf '%s' 'café' | shasum -a 256`
    expect(await sha256("café")).toBe(
      "850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e",
    );
  });
});
