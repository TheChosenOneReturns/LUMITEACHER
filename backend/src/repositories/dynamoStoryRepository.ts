import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  type RewardGrant,
  type RewardState,
  type StorySummary,
} from "@story-teacher/shared";
import type { AppConfig } from "../config";
import {
  AttemptAlreadyExistsError,
  DuplicateStoryError,
} from "../domain/errors";
import type {
  AttemptRepository,
  StoredAttempt,
  StoredStory,
  StoryRepository,
} from "../domain/models";
import { grantForAttempt, normalizeRewardState } from "../platform/rewards";

interface IdempotencyItem {
  PK: string;
  SK: string;
  entityType: "IDEMPOTENCY";
  storyId: string;
  createdAt: string;
}

interface StoryProjection extends StorySummary {
  PK: string;
  SK: string;
  entityType: "STORY_PROJECTION";
}

interface ProfileItem {
  displayName: string;
}

interface StoredRewardState extends RewardState {
  PK: string;
  SK: "REWARDS";
  entityType: "REWARD_STATE";
}

export class DynamoStoryRepository
  implements StoryRepository, AttemptRepository
{
  readonly documentClient: DynamoDBDocumentClient;

  constructor(readonly config: AppConfig) {
    const client = new DynamoDBClient({
      region: config.region,
      ...(config.dynamoEndpoint
        ? {
            endpoint: config.dynamoEndpoint,
            credentials: {
              accessKeyId: "local",
              secretAccessKey: "local",
            },
          }
        : {}),
    });
    this.documentClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async saveStory(story: StoredStory): Promise<void> {
    const idempotencyItem: IdempotencyItem = {
      PK: userPartition(story.userId),
      SK: `IDEMPOTENCY#${story.idempotencyKey}`,
      entityType: "IDEMPOTENCY",
      storyId: story.storyId,
      createdAt: story.createdAt,
    };
    const projection: StoryProjection = {
      PK: userPartition(story.userId),
      SK: `STORY#${story.createdAt}#${story.storyId}`,
      entityType: "STORY_PROJECTION",
      storyId: story.storyId,
      createdAt: story.createdAt,
      title: story.title,
      theme: story.input.theme,
      age: story.input.age,
      courseId: story.courseId ?? null,
      source: story.source,
    };

    try {
      await this.documentClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: this.config.tableName,
                Item: story,
                ConditionExpression: "attribute_not_exists(PK)",
              },
            },
            {
              Put: {
                TableName: this.config.tableName,
                Item: projection,
                ConditionExpression: "attribute_not_exists(PK)",
              },
            },
            {
              Put: {
                TableName: this.config.tableName,
                Item: idempotencyItem,
                ConditionExpression: "attribute_not_exists(PK)",
              },
            },
          ],
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "TransactionCanceledException" ||
          error.name === "ConditionalCheckFailedException")
      ) {
        throw new DuplicateStoryError(error);
      }
      throw error;
    }
  }

  async findByIdempotencyKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<StoredStory | null> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: {
          PK: userPartition(userId),
          SK: `IDEMPOTENCY#${idempotencyKey}`,
        },
      }),
    );
    const item = response.Item as IdempotencyItem | undefined;
    return item ? this.getStory(userId, item.storyId) : null;
  }

  async getStory(userId: string, storyId: string): Promise<StoredStory | null> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: storyPartition(storyId), SK: "META" },
      }),
    );
    const story = response.Item as StoredStory | undefined;
    if (!story) return null;
    if (story.userId === userId) return story;
    if (!story.courseId) return null;

    const membership = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: {
          PK: coursePartition(story.courseId),
          SK: `MEMBER#${userId}`,
        },
      }),
    );
    return membership.Item ? story : null;
  }

  async listStories(userId: string, limit: number): Promise<StorySummary[]> {
    const response = await this.documentClient.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": userPartition(userId),
          ":prefix": "STORY#",
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (response.Items as StoryProjection[] | undefined ?? []).map(
      ({ PK: _pk, SK: _sk, entityType: _type, ...summary }) => summary,
    );
  }

  async getAttempt(
    userId: string,
    attemptId: string,
  ): Promise<StoredAttempt | null> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: userPartition(userId), SK: `ATTEMPT#${attemptId}` },
      }),
    );
    return (response.Item as StoredAttempt | undefined) ?? null;
  }

  async saveAttempt(attempt: StoredAttempt): Promise<RewardGrant | undefined> {
    try {
      await this.documentClient.send(
        new PutCommand({
          TableName: this.config.tableName,
          Item: attempt,
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        throw new AttemptAlreadyExistsError(error);
      }
      throw error;
    }

    await this.saveCompletionActivity(attempt);

    const firstCompletion = await this.claimRewardMarker(attempt, "COMPLETION");
    const firstMastery = attempt.scorePercent >= 60
      ? await this.claimRewardMarker(attempt, "MASTERY")
      : false;
    if (!firstCompletion && !firstMastery) return undefined;

    const current = await this.getRewardState(attempt.userId);
    const { state, grant } = grantForAttempt(current, {
      storyId: attempt.storyId,
      theme: attempt.theme,
      correctCount: attempt.correctCount,
      results: attempt.results,
      createdAt: attempt.createdAt,
      firstAttempt: firstCompletion,
      firstMastery,
      checkpointStars: attempt.checkpointStars ?? 0,
    });
    const storedState: StoredRewardState = {
      ...state,
      PK: userPartition(attempt.userId),
      SK: "REWARDS",
      entityType: "REWARD_STATE",
    };
    await this.documentClient.send(
      new PutCommand({ TableName: this.config.tableName, Item: storedState }),
    );
    await this.documentClient.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          PK: userPartition(attempt.userId),
          SK: `REWARD_GRANT#${attempt.attemptId}`,
          entityType: "REWARD_GRANT",
          attemptId: attempt.attemptId,
          ...grant,
        },
      }),
    );
    await this.documentClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: { PK: attempt.PK, SK: attempt.SK },
        UpdateExpression: "SET rewardGrant = :grant",
        ExpressionAttributeValues: { ":grant": grant },
      }),
    );
    return grant;
  }

  private async claimRewardMarker(attempt: StoredAttempt, marker: "COMPLETION" | "MASTERY"): Promise<boolean> {
    try {
      await this.documentClient.send(
        new PutCommand({
          TableName: this.config.tableName,
          Item: {
            PK: userPartition(attempt.userId),
            SK: `${marker}#${attempt.storyId}`,
            entityType: marker,
            storyId: attempt.storyId,
            attemptId: attempt.attemptId,
            createdAt: attempt.createdAt,
          },
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        return false;
      }
      throw error;
    }
  }

  private async getRewardState(userId: string): Promise<RewardState> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: userPartition(userId), SK: "REWARDS" },
      }),
    );
    const item = response.Item;
    return normalizeRewardState(
      item
        ? Object.fromEntries(Object.entries(item).filter(([key]) => !["PK", "SK", "entityType"].includes(key)))
        : undefined,
    );
  }

  private async saveCompletionActivity(attempt: StoredAttempt): Promise<void> {
    if (!attempt.courseId) return;
    const profile = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: userPartition(attempt.userId), SK: "PROFILE" },
      }),
    );
    await this.documentClient.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          PK: coursePartition(attempt.courseId),
          SK: `ACTIVITY#${attempt.createdAt}#${attempt.attemptId}`,
          entityType: "ACTIVITY",
          activityId: attempt.attemptId,
          courseId: attempt.courseId,
          userId: attempt.userId,
          displayName: (profile.Item as ProfileItem | undefined)?.displayName ?? "Estudiante",
          storyId: attempt.storyId,
          missionId: attempt.missionId ?? null,
          type: "attempt_completed",
          createdAt: attempt.createdAt,
          scorePercent: attempt.scorePercent,
        },
      }),
    );
  }
}

export function userPartition(userId: string): string {
  return `USER#${userId}`;
}

export function storyPartition(storyId: string): string {
  return `STORY#${storyId}`;
}

export function coursePartition(courseId: string): string {
  return `COURSE#${courseId}`;
}
