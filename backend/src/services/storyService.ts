import {
  toInteractiveAdventurePublic,
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
  GenerationLimitError,
  StoryNotFoundError,
} from "../domain/errors";
import type {
  AttemptRepository,
  StoredAttempt,
  StoredStory,
  StoryApplicationService,
  StoryCreationContext,
  StoryGenerator,
  StoryRepository,
} from "../domain/models";
import { storyPartition, userPartition } from "../repositories/dynamoStoryRepository";

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
    context: StoryCreationContext = {},
  ): Promise<StoryPublic> {
    const existing = await this.storyRepository.findByIdempotencyKey(
      userId,
      idempotencyKey,
    );
    if (existing) {
      return toPublicStory(existing);
    }

    const dayKey = new Date().toISOString().slice(0, 10);
    const slotClaimed = await this.storyRepository.claimGenerationSlot(
      userId,
      dayKey,
      this.config.maxGenerationsPerDay,
    );
    if (!slotClaimed) {
      throw new GenerationLimitError();
    }

    let title: string;
    let storyText: string;
    let questions: StoredStory["questions"];
    let adventure: StoredStory["adventure"];

    if (input.storyMode === "interactive" && this.generator.generateInteractive) {
      const generated = await this.generator.generateInteractive(input);
      adventure = toInteractiveAdventurePublic(generated);
      title = generated.title;
      storyText = generated.opening.pages.map((page) => page.text).join("\n\n");
      questions = generated.finalQuestions;
    } else {
      const generated = await this.generator.generate(input);
      title = generated.title;
      storyText = generated.story;
      questions = generated.questions;
    }

    const storyId = ulid();
    const createdAt = new Date().toISOString();
    const stored: StoredStory = {
      PK: storyPartition(storyId),
      SK: "META",
      entityType: "STORY",
      userId,
      storyId,
      createdAt,
      idempotencyKey,
      input,
      title,
      story: storyText,
      questions,
      ...(adventure ? { adventure } : {}),
      modelId: this.generator.modelId,
      promptVersion: this.config.promptVersion,
      source: context.source ?? "free",
      ...(context.courseId ? { courseId: context.courseId } : {}),
      ...(context.missionId ? { missionId: context.missionId } : {}),
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
        statement: question.statement,
        selectedOption: question.options[selectedAnswer]!,
        correctOption: question.options[question.correctAnswer]!,
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
      SK: `ATTEMPT#${input.attemptId}`,
      entityType: "ATTEMPT",
      userId,
      answers: input.answers,
      storyTitle: story.title,
      theme: story.input.theme,
      checkpointStars: input.checkpointStars ?? 0,
      ...(story.courseId ? { courseId: story.courseId } : {}),
      ...(story.missionId ? { missionId: story.missionId } : {}),
    };

    const rewardGrant = await this.attemptRepository.saveAttempt(stored);
    return { ...result, rewardGrant: rewardGrant ?? null };
  }

  async getAttempt(userId: string, attemptId: string): Promise<AttemptResult> {
    const attempt = await this.storyRepository.getAttempt(userId, attemptId);
    if (!attempt) {
      throw new StoryNotFoundError();
    }
    return {
      attemptId: attempt.attemptId,
      storyId: attempt.storyId,
      createdAt: attempt.createdAt,
      correctCount: attempt.correctCount,
      scorePercent: attempt.scorePercent,
      results: attempt.results,
      rewardGrant: attempt.rewardGrant ?? null,
    };
  }
}

export function toPublicStory(story: StoredStory): StoryPublic {
  return {
    storyId: story.storyId,
    createdAt: story.createdAt,
    input: story.input,
    title: story.title,
    story: story.story,
    courseId: story.courseId ?? null,
    missionId: story.missionId ?? null,
    source: story.source,
    questions: story.questions.map((question, index) => ({
      questionId: `q${index + 1}`,
      statement: question.statement,
      options: question.options,
      skill: question.skill,
    })),
    adventure: story.adventure ?? null,
  };
}
