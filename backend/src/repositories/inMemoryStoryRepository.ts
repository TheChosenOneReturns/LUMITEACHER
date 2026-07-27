import type { RewardGrant, RewardState, StorySummary } from "@story-teacher/shared";
import { AttemptAlreadyExistsError } from "../domain/errors";
import type {
  AttemptRepository,
  StoredAttempt,
  StoredStory,
  StoryRepository,
} from "../domain/models";
import { emptyRewardState, grantForAttempt } from "../platform/rewards";

export class InMemoryStoryRepository
  implements StoryRepository, AttemptRepository
{
  private readonly stories = new Map<string, StoredStory>();
  private readonly idempotency = new Map<string, string>();
  private readonly attempts = new Map<string, StoredAttempt>();
  private readonly rewards = new Map<string, RewardState>();
  private readonly completions = new Set<string>();
  private readonly masteries = new Set<string>();
  private readonly generationCounters = new Map<string, number>();

  async claimGenerationSlot(
    userId: string,
    dayKey: string,
    maxPerDay: number,
  ): Promise<boolean> {
    const key = `${userId}#GEN#${dayKey}`;
    const current = this.generationCounters.get(key) ?? 0;
    if (current >= maxPerDay) {
      return false;
    }
    this.generationCounters.set(key, current + 1);
    return true;
  }

  async saveStory(story: StoredStory): Promise<void> {
    this.stories.set(storyKey(story.userId, story.storyId), story);
    this.idempotency.set(
      idempotencyKey(story.userId, story.idempotencyKey),
      story.storyId,
    );
  }

  async findByIdempotencyKey(
    userId: string,
    key: string,
  ): Promise<StoredStory | null> {
    const storyId = this.idempotency.get(idempotencyKey(userId, key));
    return storyId ? this.getStory(userId, storyId) : null;
  }

  async getStory(
    userId: string,
    storyId: string,
  ): Promise<StoredStory | null> {
    return this.stories.get(storyKey(userId, storyId)) ?? null;
  }

  async listStories(userId: string, limit: number): Promise<StorySummary[]> {
    return [...this.stories.values()]
      .filter((story) => story.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((story) => ({
        storyId: story.storyId,
        createdAt: story.createdAt,
        title: story.title,
        theme: story.input.theme,
        age: story.input.age,
        courseId: story.courseId ?? null,
        source: story.source,
      }));
  }

  async getAttempt(userId: string, attemptId: string): Promise<StoredAttempt | null> {
    return this.attempts.get(`${userId}#${attemptId}`) ?? null;
  }

  async saveAttempt(attempt: StoredAttempt): Promise<RewardGrant | undefined> {
    const key = `${attempt.userId}#${attempt.attemptId}`;
    if (this.attempts.has(key)) {
      throw new AttemptAlreadyExistsError();
    }
    this.attempts.set(key, attempt);
    const completionKey = `${attempt.userId}#${attempt.storyId}`;
    const firstAttempt = !this.completions.has(completionKey);
    const firstMastery = attempt.scorePercent >= 60 && !this.masteries.has(completionKey);
    if (!firstAttempt && !firstMastery) return undefined;
    if (firstAttempt) this.completions.add(completionKey);
    if (firstMastery) this.masteries.add(completionKey);
    const { state, grant } = grantForAttempt(
      this.rewards.get(attempt.userId) ?? emptyRewardState(),
      {
        storyId: attempt.storyId,
        theme: attempt.theme,
        correctCount: attempt.correctCount,
        results: attempt.results,
        createdAt: attempt.createdAt,
        firstAttempt,
        firstMastery,
        checkpointStars: attempt.checkpointStars ?? 0,
      },
    );
    this.rewards.set(attempt.userId, state);
    attempt.rewardGrant = grant;
    return grant;
  }
}

function storyKey(userId: string, storyId: string): string {
  return `${userId}#${storyId}`;
}

function idempotencyKey(userId: string, key: string): string {
  return `${userId}#${key}`;
}
