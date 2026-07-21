import { describe, expect, it } from "vitest";
import fixture from "../../../contracts/story-generation.example.json";
import {
  GeneratedStoryValidationError,
  countWords,
  generatedStorySchema,
  parseGeneratedStory,
  skillValues,
} from "./index";

describe("story generation contract", () => {
  it("accepts the canonical fixture", () => {
    const story = parseGeneratedStory(fixture, 300);

    expect(story.questions).toHaveLength(5);
    expect(story.questions.map((question) => question.skill)).toEqual(
      skillValues,
    );
    expect(countWords(story.story)).toBe(164);
  });

  it("rejects a story over the requested word limit", () => {
    expect(() => parseGeneratedStory(fixture, 150)).toThrow(
      GeneratedStoryValidationError,
    );
  });

  it("rejects duplicated answer options", () => {
    const invalid = structuredClone(fixture);
    invalid.questions[0]!.options[1] = invalid.questions[0]!.options[0]!;

    expect(generatedStorySchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects skills outside the canonical order", () => {
    const invalid = structuredClone(fixture);
    invalid.questions[0]!.skill = "sequence";

    expect(generatedStorySchema.safeParse(invalid).success).toBe(false);
  });
});

