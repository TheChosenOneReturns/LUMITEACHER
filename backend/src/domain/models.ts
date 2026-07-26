import type {
  AttemptResult,
  GeneratedInteractiveStory,
  GeneratedStory,
  GenerateStoryInput,
  InteractiveAdventurePublic,
  RewardGrant,
  StoryPublic,
  StorySummary,
  SubmitAttemptInput,
} from "@story-teacher/shared";

export interface AuthenticatedIdentity {
  userId: string;
  sessionId?: string;
  expiresAtEpochSeconds?: number;
}

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
  adventure?: InteractiveAdventurePublic;
  courseId?: string;
  missionId?: string;
  source: "free" | "mission";
}

export interface StoredAttempt extends AttemptResult {
  PK: string;
  SK: string;
  entityType: "ATTEMPT";
  userId: string;
  answers: number[];
  courseId?: string;
  missionId?: string;
  storyTitle: string;
  theme: string;
  checkpointStars?: number;
}

export interface StoryCreationContext {
  courseId?: string;
  missionId?: string;
  source?: "free" | "mission";
}

export interface StoryGenerator {
  readonly modelId: string;
  generate(input: GenerateStoryInput): Promise<GeneratedStory>;
  generateInteractive?(
    input: GenerateStoryInput,
  ): Promise<GeneratedInteractiveStory>;
}

export interface StoryRepository {
  saveStory(story: StoredStory): Promise<void>;
  findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<StoredStory | null>;
  getStory(userId: string, storyId: string): Promise<StoredStory | null>;
  listStories(userId: string, limit: number): Promise<StorySummary[]>;
  getAttempt(userId: string, attemptId: string): Promise<StoredAttempt | null>;
  claimGenerationSlot(
    userId: string,
    dayKey: string,
    maxPerDay: number,
  ): Promise<boolean>;
}

export interface AttemptRepository {
  saveAttempt(attempt: StoredAttempt): Promise<RewardGrant | undefined>;
}

export interface StoryApplicationService {
  createStory(
    userId: string,
    input: GenerateStoryInput,
    idempotencyKey: string,
    context?: StoryCreationContext,
  ): Promise<StoryPublic>;
  getStory(userId: string, storyId: string): Promise<StoryPublic>;
  listStories(userId: string, limit: number): Promise<StorySummary[]>;
  submitAttempt(
    userId: string,
    storyId: string,
    input: SubmitAttemptInput,
  ): Promise<AttemptResult>;
  getAttempt(userId: string, attemptId: string): Promise<AttemptResult>;
}
