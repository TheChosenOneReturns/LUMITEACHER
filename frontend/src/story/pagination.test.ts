import { describe, expect, it } from "vitest";
import { narrationWordRanges, paginateStoryText, tokenizeNarration } from "./pagination";

describe("story pagination", () => {
  it("splits a long story into readable pages without losing paragraphs", () => {
    const paragraphs = Array.from({ length: 9 }, (_, index) => `Párrafo ${index + 1} ${"contiene pistas importantes para comprender la aventura y anticipar sus consecuencias ".repeat(4).trim()}.`);
    const story = paragraphs.join("\n\n");
    const pages = paginateStoryText(story, 90);
    expect(pages.length).toBeGreaterThan(2);
    expect(pages.join("\n\n")).toBe(story);
    expect(pages.every((page) => page.split(/\s+/u).length <= 145)).toBe(true);
  });

  it("keeps exact character ranges for narration highlighting", () => {
    const text = "Lumi abre una página nueva.";
    const ranges = narrationWordRanges(text);
    expect(ranges.map((range) => text.slice(range.start, range.end))).toEqual(["Lumi", "abre", "una", "página", "nueva."]);
    expect(tokenizeNarration(text).map((token) => token.text).join("")).toBe(text);
  });
});
