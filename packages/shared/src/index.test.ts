import { describe, expect, it } from "vitest";
import fixture from "../../../contracts/story-generation.example.json";
import {
  createDemoProfileSchema,
  GeneratedStoryValidationError,
  countWords,
  generatedStorySchema,
  parseGeneratedStory,
  platformCatalog,
  platformCatalogSchema,
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

  it("validates a safe custom child profile", () => {
    expect(createDemoProfileSchema.parse({
      displayName: "Nina",
      age: 9,
      avatarId: "animal-panda",
      favoriteTheme: "Selva",
    }).avatarId).toBe("animal-panda");
  });

  it("keeps the complete rewards catalog valid and unique", () => {
    expect(platformCatalogSchema.safeParse(platformCatalog).success).toBe(true);
    expect(platformCatalog.worlds).toHaveLength(6);
    expect(platformCatalog.cards).toHaveLength(24);
    expect(platformCatalog.avatars).toHaveLength(24);
    expect(platformCatalog.games).toHaveLength(10);
    expect(new Set(platformCatalog.cards.map((card) => card.id)).size).toBe(24);
    expect(new Set(platformCatalog.cards.map((card) => card.power)).size).toBe(24);
    expect(new Set(platformCatalog.games.map((game) => game.id)).size).toBe(10);
    expect(platformCatalog.cards.every((card) => card.gameId === null || platformCatalog.games.some((game) => game.id === card.gameId))).toBe(true);
    expect(platformCatalog.worlds.every((world) => platformCatalog.cards.filter((card) => card.worldId === world.id).length === 4)).toBe(true);
  });
});
