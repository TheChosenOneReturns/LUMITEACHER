import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import type {
  ErrorCode,
  GenerateStoryInput,
} from "@story-teacher/shared";
import type { AppConfig } from "../config";
import type { StoryCreationContext } from "../domain/models";
import { userPartition } from "../repositories/dynamoStoryRepository";

interface GenerationJobBase {
  PK: string;
  SK: string;
  entityType: "GENERATION_JOB";
  generationId: string;
  userId: string;
  input: GenerateStoryInput;
  idempotencyKey: string;
  context: StoryCreationContext;
  createdAt: string;
  updatedAt: string;
  ttl: number;
}

export interface PendingGenerationJob extends GenerationJobBase {
  status: "pending";
}

export interface CompletedGenerationJob extends GenerationJobBase {
  status: "completed";
  storyId: string;
}

export interface FailedGenerationJob extends GenerationJobBase {
  status: "failed";
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type GenerationJob =
  | PendingGenerationJob
  | CompletedGenerationJob
  | FailedGenerationJob;

export interface GenerationWorkerEvent {
  generationId: string;
  userId: string;
  input: GenerateStoryInput;
  idempotencyKey: string;
  context: StoryCreationContext;
}

export class DynamoGenerationJobRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly config: AppConfig,
  ) {}

  async createPending(
    event: GenerationWorkerEvent,
  ): Promise<{ job: GenerationJob; created: boolean }> {
    const now = new Date();
    const job: PendingGenerationJob = {
      PK: userPartition(event.userId),
      SK: generationSortKey(event.generationId),
      entityType: "GENERATION_JOB",
      ...event,
      status: "pending",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      ttl: Math.floor(now.getTime() / 1_000) + 24 * 60 * 60,
    };

    try {
      await this.documentClient.send(
        new PutCommand({
          TableName: this.config.tableName,
          Item: job,
          ConditionExpression:
            "attribute_not_exists(PK) AND attribute_not_exists(SK)",
        }),
      );
      return { job, created: true };
    } catch (error) {
      if (!isConditionalCheckFailed(error)) throw error;
      const existing = await this.get(event.userId, event.generationId);
      if (!existing) throw error;
      return { job: existing, created: false };
    }
  }

  async get(
    userId: string,
    generationId: string,
  ): Promise<GenerationJob | null> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: {
          PK: userPartition(userId),
          SK: generationSortKey(generationId),
        },
        ConsistentRead: true,
      }),
    );
    return (response.Item as GenerationJob | undefined) ?? null;
  }

  async markCompleted(
    userId: string,
    generationId: string,
    storyId: string,
  ): Promise<void> {
    await this.documentClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: {
          PK: userPartition(userId),
          SK: generationSortKey(generationId),
        },
        UpdateExpression:
          "SET #status = :completed, storyId = :storyId, updatedAt = :updatedAt REMOVE #error",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: {
          "#status": "status",
          "#error": "error",
        },
        ExpressionAttributeValues: {
          ":completed": "completed",
          ":storyId": storyId,
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );
  }

  async markFailed(
    userId: string,
    generationId: string,
    error: FailedGenerationJob["error"],
  ): Promise<void> {
    await this.documentClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: {
          PK: userPartition(userId),
          SK: generationSortKey(generationId),
        },
        UpdateExpression:
          "SET #status = :failed, #error = :error, updatedAt = :updatedAt",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: {
          "#status": "status",
          "#error": "error",
        },
        ExpressionAttributeValues: {
          ":failed": "failed",
          ":error": error,
          ":updatedAt": new Date().toISOString(),
        },
      }),
    );
  }
}

function generationSortKey(generationId: string): string {
  return `GENERATION#${generationId}`;
}

function isConditionalCheckFailed(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "ConditionalCheckFailedException"
  );
}
