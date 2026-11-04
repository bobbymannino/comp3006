import { describe, expect, it } from "@jest/globals";
import { logger } from "./log.ts";

describe("logger", () => {
  it("names the logger after its tag", () => {
    expect(logger("db").settings.name).toBe("db");
  });

  it("creates a separate logger for each tag", () => {
    const a = logger("a");
    const b = logger("b");

    expect(a).not.toBe(b);
    expect(b.settings.name).toBe("b");
  });

  it("logs debug messages and above", () => {
    // tslog levels: 0 silly, 1 trace, 2 debug
    expect(logger("x").settings.minLevel).toBe(2);
  });
});
