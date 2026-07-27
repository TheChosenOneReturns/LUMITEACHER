import { describe, expect, it } from "vitest";
import fixture from "../../../contracts/story-generation.example.json";
import interactiveFixture from "../../../contracts/interactive-story.example.json";
import {
  createDemoProfileSchema,
  GeneratedStoryValidationError,
  countWords,
  generatedInteractiveStorySchema,
  generatedStorySchema,
  generationStatusSchema,
  parseGeneratedInteractiveStory,
  parseGeneratedStory,
  platformCatalog,
  platformCatalogSchema,
  skillValues,
  toInteractiveAdventurePublic,
} from "./index";

describe("story generation contract", () => {
  it("validates pending and failed asynchronous generation states", () => {
    const generationId = "a".repeat(32);
    expect(
      generationStatusSchema.safeParse({
        generationId,
        status: "pending",
      }).success,
    ).toBe(true);
    expect(
      generationStatusSchema.safeParse({
        generationId,
        status: "failed",
        error: {
          code: "GENERATION_FAILED",
          message: "No se pudo generar.",
        },
      }).success,
    ).toBe(true);
  });

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

describe("interactive story contract (v2)", () => {
  it("accepts the canonical interactive fixture", () => {
    const adventure = parseGeneratedInteractiveStory(interactiveFixture, 300);

    expect(adventure.routes).toHaveLength(2);
    expect(adventure.routes.flatMap((route) => route.endings)).toHaveLength(4);
    expect(adventure.finalQuestions.map((question) => question.skill)).toEqual(
      skillValues,
    );
  });

  it("rejects choices pointing to missing scenes", () => {
    const invalid = structuredClone(interactiveFixture);
    invalid.opening.choices[0]!.nextSceneId = "route-fantasma";

    expect(() => parseGeneratedInteractiveStory(invalid, 300)).toThrow(
      GeneratedStoryValidationError,
    );
  });

  it("rejects final questions outside the canonical skill order", () => {
    const invalid = structuredClone(interactiveFixture);
    invalid.finalQuestions[0]!.skill = "sequence";

    expect(generatedInteractiveStorySchema.safeParse(invalid).success).toBe(
      false,
    );
  });

  it("rejects a path over the requested word limit", () => {
    expect(() => parseGeneratedInteractiveStory(interactiveFixture, 50)).toThrow(
      GeneratedStoryValidationError,
    );
  });

  it("flattens the generated adventure into 7 public scenes", () => {
    const adventure = parseGeneratedInteractiveStory(interactiveFixture, 300);
    const publicAdventure = toInteractiveAdventurePublic(adventure);

    expect(publicAdventure.scenes).toHaveLength(7);
    expect(publicAdventure.scenes[0]?.id).toBe("opening");
    expect(
      publicAdventure.scenes.filter((scene) => scene.ending),
    ).toHaveLength(4);
    expect(
      publicAdventure.scenes.filter((scene) => scene.checkpoint !== null),
    ).toHaveLength(3);
  });
});
