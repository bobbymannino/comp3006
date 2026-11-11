import { describe, expect, it } from "@jest/globals";

import { isDuplicateKeyError } from "./db-errors.ts";

describe("isDuplicateKeyError", () => {
  it("is true for a MongoDB duplicate key error", () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
  });

  it("is false for a different code", () => {
    expect(isDuplicateKeyError({ code: 12 })).toBe(false);
  });
});
