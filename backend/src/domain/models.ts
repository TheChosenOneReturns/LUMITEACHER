import type {
  AttemptResult,
  GeneratedStory,
  GenerateStoryInput,
  StoryPublic,
  StorySummary,
  SubmitAttemptInput,
} from "@story-teacher/shared";

export interface StoredStory extends GeneratedStory {
  PK: string;
  SK: string;
  entityType: "STORY";
  userId: string;
  storyId: string;
  createdAt: string;
  idempotencyKey: string;
  input: GenerateStoryInput;
  modelId: string;
  promptVersion: string;
}

export interface StoredAttempt extends AttemptResult {
  PK: string;
  SK: string;
  entityType: "ATTEMPT";
  userId: string;
  answers: number[];
}

export interface StoryGenerator {
  readonly modelId: string;
  generate(input: GenerateStoryInput): Promise<GeneratedStory>;
}

export interface StoryRepository {
  saveStory(story: StoredStory): Promise<void>;
  findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<StoredStory | null>;
  getStory(userId: string, storyId: string): Promise<StoredStory | null>;
  listStories(userId: string, limit: number): Promise<StorySummary[]>;
}

export interface AttemptRepository {
  saveAttempt(attempt: StoredAttempt): Promise<void>;
}

export interface StoryApplicationService {
  createStory(
    userId: string,
    input: GenerateStoryInput,
    idempotencyKey: string,
  ): Promise<StoryPublic>;
  getStory(userId: string, storyId: string): Promise<StoryPublic>;
  listStories(userId: string, limit: number): Promise<StorySummary[]>;
  submitAttempt(
    userId: string,
    storyId: string,
    input: SubmitAttemptInput,
  ): Promise<AttemptResult>;
}

