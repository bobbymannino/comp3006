import { describe, expect, it } from "@jest/globals";

import { logger } from "./log.ts";

describe("logger", () => {
  it("creates a logger named after its tag", () => {
    expect(logger("test").settings.name).toBe("test");
  });
});
