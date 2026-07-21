import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { StorySummary } from "@story-teacher/shared";
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

interface IdempotencyItem {
  PK: string;
  SK: string;
  entityType: "IDEMPOTENCY";
  storyId: string;
  createdAt: string;
}

export class DynamoStoryRepository
  implements StoryRepository, AttemptRepository
{
  private readonly documentClient: DynamoDBDocumentClient;

  constructor(private readonly config: AppConfig) {
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
      PK: story.PK,
      SK: `IDEMPOTENCY#${story.idempotencyKey}`,
      entityType: "IDEMPOTENCY",
      storyId: story.storyId,
      createdAt: story.createdAt,
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

  async getStory(
    userId: string,
    storyId: string,
  ): Promise<StoredStory | null> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: {
          PK: userPartition(userId),
          SK: `STORY#${storyId}`,
        },
      }),
    );
    return (response.Item as StoredStory | undefined) ?? null;
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

    return (response.Items as StoredStory[] | undefined ?? []).map((story) => ({
      storyId: story.storyId,
      createdAt: story.createdAt,
      title: story.title,
      theme: story.input.theme,
      age: story.input.age,
    }));
  }

  async saveAttempt(attempt: StoredAttempt): Promise<void> {
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
  }
}

export function userPartition(userId: string): string {
  return `USER#${userId}`;
}

