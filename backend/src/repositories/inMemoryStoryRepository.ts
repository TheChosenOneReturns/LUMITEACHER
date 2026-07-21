import type { StorySummary } from "@story-teacher/shared";
import { AttemptAlreadyExistsError } from "../domain/errors";
import type {
  AttemptRepository,
  StoredAttempt,
  StoredStory,
  StoryRepository,
} from "../domain/models";

export class InMemoryStoryRepository
  implements StoryRepository, AttemptRepository
{
  private readonly stories = new Map<string, StoredStory>();
  private readonly idempotency = new Map<string, string>();
  private readonly attempts = new Map<string, StoredAttempt>();

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
      }));
  }

  async saveAttempt(attempt: StoredAttempt): Promise<void> {
    const key = `${attempt.userId}#${attempt.attemptId}`;
    if (this.attempts.has(key)) {
      throw new AttemptAlreadyExistsError();
    }
    this.attempts.set(key, attempt);
  }
}

function storyKey(userId: string, storyId: string): string {
  return `${userId}#${storyId}`;
}

function idempotencyKey(userId: string, key: string): string {
  return `${userId}#${key}`;
}

