import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../config.js";
import { PlatformService } from "./platformService.js";

const config: AppConfig = {
  tableName: "StoryTeacherTest",
  region: "us-east-2",
  generatorMode: "fixture",
  authMode: "demo",
  sessionIpPolicy: "off",
  modelId: "fixture",
  allowedOrigin: "http://localhost:5173",
  promptVersion: "story-v1",
  maxGenerationsPerDay: 20,
};

const adult = {
  userId: "adult-owner",
  role: "adult" as const,
  displayName: "Ada",
  age: null,
  avatarId: "adult-teacher",
  favoriteTheme: "Ciencia",
  adultLabel: "Profesor/a" as const,
};

const course = {
  PK: "COURSE#course-123456",
  SK: "META",
  entityType: "COURSE",
  courseId: "course-123456",
  name: "Exploradores",
  description: "",
  ownerUserId: adult.userId,
  createdAt: "2026-07-26T12:00:00.000Z",
};

const story = {
  storyId: "01KYYSTORY0000000000000000",
  createdAt: "2026-07-26T12:05:00.000Z",
  title: "El mapa de las estrellas",
  courseId: course.courseId,
  missionId: "01KYYMISSION00000000000000",
  source: "mission" as const,
  input: {
    theme: "Espacio",
    educationalObjective: "Reconocer causas y consecuencias",
  },
};

describe("PlatformService.publishMission", () => {
  it("publica una vista previa ya generada sin invocar IA", async () => {
    let published: Record<string, unknown> | undefined;
    const send = vi.fn(
      async (command: {
        constructor: { name: string };
        input?: {
          Key?: { SK?: string };
          Item?: Record<string, unknown>;
        };
      }) => {
        if (command.input?.Key?.SK === "PROFILE") return { Item: adult };
        if (command.input?.Key?.SK === "META") return { Item: course };
        if (command.constructor.name === "PutCommand") {
          published = command.input?.Item;
        }
        return {};
      },
    );
    const service = new PlatformService(
      { send } as unknown as DynamoDBDocumentClient,
      config,
    );

    const mission = await service.publishMission(
      adult.userId,
      course.courseId,
      story.missionId,
      story,
    );

    expect(mission).toMatchObject({
      missionId: story.missionId,
      storyId: story.storyId,
      status: "active",
    });
    expect(published).toMatchObject({
      PK: `COURSE#${course.courseId}`,
      SK: `MISSION#${story.createdAt}#${story.missionId}`,
      storyId: story.storyId,
    });
    expect(
      send.mock.calls.some(
        ([command]) => command.constructor.name.includes("Bedrock"),
      ),
    ).toBe(false);
  });

  it("rechaza una vista previa creada para otro curso", async () => {
    const send = vi.fn(
      async (command: { input?: { Key?: { SK?: string } } }) =>
        command.input?.Key?.SK === "PROFILE"
          ? { Item: adult }
          : { Item: course },
    );
    const service = new PlatformService(
      { send } as unknown as DynamoDBDocumentClient,
      config,
    );

    await expect(
      service.publishMission(
        adult.userId,
        course.courseId,
        story.missionId,
        { ...story, courseId: "course-other" },
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      statusCode: 409,
    });
  });
});
