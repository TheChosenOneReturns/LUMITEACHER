import { describe, expect, it } from "vitest";
import type { GenerateStoryInput } from "@story-teacher/shared";
import type { AppConfig } from "../config";
import { AttemptAlreadyExistsError, StoryNotFoundError } from "../domain/errors";
import { FixtureStoryGenerator } from "../generators/fixtureStoryGenerator";
import { InMemoryStoryRepository } from "../repositories/inMemoryStoryRepository";
import { StoryService } from "./storyService";

const config: AppConfig = {
  tableName: "test",
  region: "us-east-1",
  generatorMode: "fixture",
  authMode: "demo",
  sessionIpPolicy: "off",
  modelId: "fixture",
  allowedOrigin: "http://localhost:5173",
  promptVersion: "story-v1",
  maxGenerationsPerDay: 20,
};

const input: GenerateStoryInput = {
  age: 8,
  theme: "Espacio",
  difficulty: "media",
  educationalObjective: "Valorar el trabajo en equipo",
  maxWords: 300,
  mainCharacter: "Luna, una gata astronauta",
};
const fixtureAnswerKey = [0, 1, 2, 3, 1];

function createService() {
  const repository = new InMemoryStoryRepository();
  return new StoryService(
    new FixtureStoryGenerator(),
    repository,
    repository,
    config,
  );
}

describe("StoryService", () => {
  it("creates an idempotent public story without the answer key", async () => {
    const service = createService();
    const first = await service.createStory(
      "demo-sofia",
      input,
      "1234567890abcdef",
    );
    const second = await service.createStory(
      "demo-sofia",
      input,
      "1234567890abcdef",
    );

    expect(second.storyId).toBe(first.storyId);
    expect(first.questions).toHaveLength(5);
    expect(JSON.stringify(first)).not.toContain("correctAnswer");
    expect(JSON.stringify(first)).not.toContain("explanation");
  });

  it("lists and retrieves the persisted story", async () => {
    const service = createService();
    const story = await service.createStory(
      "demo-sofia",
      input,
      "1234567890abcdef",
    );

    await expect(service.getStory("demo-sofia", story.storyId)).resolves.toEqual(
      story,
    );
    await expect(service.listStories("demo-sofia", 20)).resolves.toMatchObject([
      { storyId: story.storyId, title: story.title },
    ]);
  });

  it("grades five answers and returns explanations only after submission", async () => {
    const service = createService();
    const story = await service.createStory(
      "demo-sofia",
      input,
      "1234567890abcdef",
    );
    const result = await service.submitAttempt("demo-sofia", story.storyId, {
      attemptId: "01TESTATTEMPT00000000000000",
      answers: fixtureAnswerKey,
    });

    expect(result.correctCount).toBe(5);
    expect(result.scorePercent).toBe(100);
    expect(result.results.every((item) => item.isCorrect)).toBe(true);
    expect(result.results[0]?.explanation).toBeTruthy();
  });

  it.each([
    [0, 0],
    [1, 20],
    [2, 40],
    [3, 60],
    [4, 80],
    [5, 100],
  ] as const)(
    "maps %i correct answers to %i percent",
    async (correctAnswers, expectedPercent) => {
      const service = createService();
      const story = await service.createStory(
        "demo-sofia",
        input,
        `idempotency-${correctAnswers}`,
      );
      const answerKey = fixtureAnswerKey;
      const answers = answerKey.map((answer, index) =>
        index < correctAnswers ? answer : (answer + 1) % 4,
      );

      const result = await service.submitAttempt("demo-sofia", story.storyId, {
        attemptId: `01SCORE${correctAnswers}000000000000000000`,
        answers,
      });

      expect(result.correctCount).toBe(correctAnswers);
      expect(result.scorePercent).toBe(expectedPercent);
    },
  );

  it("prevents duplicate attempts", async () => {
    const service = createService();
    const story = await service.createStory(
      "demo-sofia",
      input,
      "1234567890abcdef",
    );
    const attempt = {
      attemptId: "01TESTATTEMPT00000000000000",
      answers: [0, 0, 1, 0, 0],
    };
    await service.submitAttempt("demo-sofia", story.storyId, attempt);

    await expect(
      service.submitAttempt("demo-sofia", story.storyId, attempt),
    ).rejects.toBeInstanceOf(AttemptAlreadyExistsError);
  });

  it("returns not found for another profile or story", async () => {
    const service = createService();

    await expect(
      service.getStory("demo-sofia", "missing-story"),
    ).rejects.toBeInstanceOf(StoryNotFoundError);
  });
});
