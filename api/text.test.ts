import { describe, expect, it } from "@jest/globals";
import { PREVIEW_WORDS, preview } from "./text.ts";

/** A string of `count` numbered words, e.g. "w1 w2 w3" */
const words = (count: number) => Array.from({ length: count }, (_, i) => `w${i + 1}`).join(" ");

describe("preview", () => {
  it("leaves short text unchanged", () => {
    expect(preview("Just some text here")).toBe("Just some text here");
  });

  it("leaves text of exactly the limit unchanged", () => {
    expect(preview(words(PREVIEW_WORDS))).toBe(words(PREVIEW_WORDS));
  });

  it("cuts text over the limit and adds an ellipsis", () => {
    expect(preview(words(PREVIEW_WORDS + 1))).toBe(`${words(PREVIEW_WORDS)}…`);
  });

  it("keeps exactly the limit of words when cut", () => {
    const result = preview(words(PREVIEW_WORDS * 3));
    expect(result.slice(0, -1).split(" ")).toHaveLength(PREVIEW_WORDS);
    expect(result.endsWith(`w${PREVIEW_WORDS}…`)).toBe(true);
  });

  it("leaves empty text unchanged", () => {
    expect(preview("")).toBe("");
  });

  it("keeps the formatting of text that is not cut", () => {
    const text = "# Title\n\nA short paragraph.";
    expect(preview(text)).toBe(text);
  });

  it("does not count surrounding or repeated whitespace as words", () => {
    const text = `  ${words(PREVIEW_WORDS).replaceAll(" ", " \n\t ")}  `;
    expect(preview(text)).toBe(text);
  });

  it("joins the words of cut text with single spaces", () => {
    const text = words(PREVIEW_WORDS + 1).replaceAll(" ", "\n\n");
    expect(preview(text)).toBe(`${words(PREVIEW_WORDS)}…`);
  });
});
