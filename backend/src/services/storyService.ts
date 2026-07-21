import {
  type AttemptResult,
  type GenerateStoryInput,
  type StoryPublic,
  type StorySummary,
  type SubmitAttemptInput,
} from "@story-teacher/shared";
import { ulid } from "ulid";
import type { AppConfig } from "../config";
import {
  DuplicateStoryError,
  StoryNotFoundError,
} from "../domain/errors";
import type {
  AttemptRepository,
  StoredAttempt,
  StoredStory,
  StoryApplicationService,
  StoryGenerator,
  StoryRepository,
} from "../domain/models";
import { userPartition } from "../repositories/dynamoStoryRepository";

export class StoryService implements StoryApplicationService {
  constructor(
    private readonly generator: StoryGenerator,
    private readonly storyRepository: StoryRepository,
    private readonly attemptRepository: AttemptRepository,
    private readonly config: AppConfig,
  ) {}

  async createStory(
    userId: string,
    input: GenerateStoryInput,
    idempotencyKey: string,
  ): Promise<StoryPublic> {
    const existing = await this.storyRepository.findByIdempotencyKey(
      userId,
      idempotencyKey,
    );
    if (existing) {
      return toPublicStory(existing);
    }

    const generated = await this.generator.generate(input);
    const storyId = ulid();
    const createdAt = new Date().toISOString();
    const stored: StoredStory = {
      PK: userPartition(userId),
      SK: `STORY#${storyId}`,
      entityType: "STORY",
      userId,
      storyId,
      createdAt,
      idempotencyKey,
      input,
      title: generated.title,
      story: generated.story,
      questions: generated.questions,
      modelId: this.generator.modelId,
      promptVersion: this.config.promptVersion,
    };

    try {
      await this.storyRepository.saveStory(stored);
      return toPublicStory(stored);
    } catch (error) {
      if (error instanceof DuplicateStoryError) {
        const raced = await this.storyRepository.findByIdempotencyKey(
          userId,
          idempotencyKey,
        );
        if (raced) {
          return toPublicStory(raced);
        }
      }
      throw error;
    }
  }

  async getStory(userId: string, storyId: string): Promise<StoryPublic> {
    const story = await this.storyRepository.getStory(userId, storyId);
    if (!story) {
      throw new StoryNotFoundError();
    }
    return toPublicStory(story);
  }

  listStories(userId: string, limit: number): Promise<StorySummary[]> {
    return this.storyRepository.listStories(userId, limit);
  }

  async submitAttempt(
    userId: string,
    storyId: string,
    input: SubmitAttemptInput,
  ): Promise<AttemptResult> {
    const story = await this.storyRepository.getStory(userId, storyId);
    if (!story) {
      throw new StoryNotFoundError();
    }

    const results = story.questions.map((question, index) => {
      const selectedAnswer = input.answers[index]!;
      return {
        questionId: `q${index + 1}`,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: selectedAnswer === question.correctAnswer,
        skill: question.skill,
        explanation: question.explanation,
      };
    });
    const correctCount = results.filter((result) => result.isCorrect).length;
    const scorePercent = (correctCount * 20) as AttemptResult["scorePercent"];
    const createdAt = new Date().toISOString();
    const result: AttemptResult = {
      attemptId: input.attemptId,
      storyId,
      createdAt,
      correctCount,
      scorePercent,
      results,
    };
    const stored: StoredAttempt = {
      ...result,
      PK: userPartition(userId),
      SK: `ATTEMPT#${storyId}#${input.attemptId}`,
      entityType: "ATTEMPT",
      userId,
      answers: input.answers,
    };

    await this.attemptRepository.saveAttempt(stored);
    return result;
  }
}

export function toPublicStory(story: StoredStory): StoryPublic {
  return {
    storyId: story.storyId,
    createdAt: story.createdAt,
    input: story.input,
    title: story.title,
    story: story.story,
    questions: story.questions.map((question, index) => ({
      questionId: `q${index + 1}`,
      statement: question.statement,
      options: question.options,
      skill: question.skill,
    })),
  };
}

