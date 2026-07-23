import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { platformCatalog, worldValues, type UserProfile, type WorldId } from "@story-teacher/shared";
import { getPlatformService, getStoryService } from "../src/container";
import { coursePartition, userPartition } from "../src/repositories/dynamoStoryRepository";
import { emptyRewardState } from "../src/platform/rewards";

process.env.TABLE_NAME ??= "StoryTeacherLocal";
process.env.DYNAMODB_ENDPOINT ??= "http://127.0.0.1:8000";
process.env.AWS_REGION ??= "us-east-1";
process.env.STORY_GENERATOR_MODE ??= "fixture";

const tableName = process.env.TABLE_NAME;
const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION,
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
  { marshallOptions: { removeUndefinedValues: true } },
);

const profiles: UserProfile[] = [
  {
    userId: "demo-lucia",
    role: "adult",
    displayName: "Lucía",
    avatarId: "mentor",
    favoriteTheme: "Fantasía",
    adultLabel: "Profesor/a",
    selectedAccessoryId: null,
  },
  {
    userId: "demo-sofia",
    role: "student",
    displayName: "Sofía",
    age: 8,
    avatarId: "explorer",
    favoriteTheme: "Espacio",
    selectedAccessoryId: null,
  },
  {
    userId: "demo-mateo",
    role: "student",
    displayName: "Mateo",
    age: 9,
    avatarId: "inventor",
    favoriteTheme: "Inventos",
    selectedAccessoryId: null,
  },
  {
    userId: "demo-valentina",
    role: "student",
    displayName: "Valentina",
    age: 7,
    avatarId: "dreamer",
    favoriteTheme: "Océano",
    selectedAccessoryId: null,
  },
  {
    userId: "demo-luna",
    role: "student",
    displayName: "Luna",
    age: 10,
    avatarId: "animal-chameleon",
    favoriteTheme: "Misterio",
    selectedAccessoryId: "cosmic-backpack",
    profileBadge: "Todo desbloqueado",
  },
];

for (const profile of profiles) {
  const base = {
    ...profile,
    PK: userPartition(profile.userId),
    SK: "PROFILE",
    entityType: "USER",
  };
  await client.send(new PutCommand({ TableName: tableName, Item: base }));
  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: { ...base, PK: "DEMO", SK: `PROFILE#${profile.userId}` },
    }),
  );
  const rewardKey = { PK: userPartition(profile.userId), SK: "REWARDS" };
  const existingRewards = await client.send(
    new GetCommand({ TableName: tableName, Key: rewardKey }),
  );
  if (!existingRewards.Item) {
    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: { ...emptyRewardState(), ...rewardKey, entityType: "REWARD_STATE" },
      }),
    );
  }
}

const marker = await client.send(
  new GetCommand({ TableName: tableName, Key: { PK: "SEED", SK: "PLATFORM_V2" } }),
);
if (marker.Item) {
  console.log("Datos base ya disponibles.");
} else {
const courseId = "01COURSEDEMO2026STORY000001";
const createdAt = new Date().toISOString();
await client.send(
  new PutCommand({
    TableName: tableName,
    Item: {
      PK: coursePartition(courseId),
      SK: "META",
      entityType: "COURSE",
      courseId,
      name: "Exploradores de historias",
      description: "Un espacio para leer, imaginar y aprender juntos.",
      ownerUserId: "demo-lucia",
      createdAt,
    },
  }),
);

for (const [userId, role] of [
  ["demo-lucia", "owner"],
  ["demo-sofia", "student"],
  ["demo-mateo", "student"],
] as const) {
  const membership = { entityType: "MEMBERSHIP", courseId, userId, role, joinedAt: createdAt };
  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: { ...membership, PK: coursePartition(courseId), SK: `MEMBER#${userId}` },
    }),
  );
  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: { ...membership, PK: userPartition(userId), SK: `COURSE#${courseId}` },
    }),
  );
}

const platform = getPlatformService();
const storyService = getStoryService();
const mission = await platform.createMission(
  "demo-lucia",
  courseId,
  {
    age: 8,
    theme: "Espacio",
    difficulty: "media",
    educationalObjective: "Reconocer el valor del trabajo en equipo",
    maxWords: 300,
    mainCharacter: "Luna, una gata astronauta",
  },
  "seed-mission-story-2026",
);
await storyService.submitAttempt("demo-sofia", mission.storyId, {
  attemptId: "01SEEDSOFIA2026ATTEMPT000001",
  answers: [0, 1, 2, 3, 1],
});

const mateoStory = await storyService.createStory(
  "demo-mateo",
  {
    age: 9,
    theme: "Inventos",
    difficulty: "media",
    educationalObjective: "Practicar la resolución colaborativa de problemas",
    maxWords: 300,
    mainCharacter: "Teo y su robot de cartón",
  },
  "seed-mateo-story-2026",
  { courseId, source: "free" },
);
await storyService.submitAttempt("demo-mateo", mateoStory.storyId, {
  attemptId: "01SEEDMATEO2026ATTEMPT000001",
  answers: [0, 0, 0, 3, 3],
});
await platform.sendCongratulation("demo-lucia", courseId, "demo-sofia", {
  templateId: "brave-reader",
  assetId: "postcard-rocket",
  highlightedSkill: "inference",
});

await client.send(
  new PutCommand({
    TableName: tableName,
    Item: { PK: "SEED", SK: "PLATFORM_V2", entityType: "SEED", createdAt },
  }),
);
console.log("Datos demo creados: 1 adulto, 3 alumnos, 1 curso y actividad inicial.");
}

const showcaseMarker = await client.send(
  new GetCommand({ TableName: tableName, Key: { PK: "SEED", SK: "REWARDS_SHOWCASE_V1" } }),
);
if (!showcaseMarker.Item) {
  const showcaseState = {
    ...emptyRewardState(),
    totalStars: 999,
    mapStep: 24,
    completedStoryIds: Array.from({ length: 24 }, (_, index) => `showcase-story-${String(index + 1).padStart(2, "0")}`),
    unlockedBadgeIds: platformCatalog.badges.map((badge) => badge.id),
    unlockedCardIds: platformCatalog.cards.map((card) => card.id),
    cardInventory: Object.fromEntries(platformCatalog.cards.map((card) => [card.id, 9])),
    worldMasteryCounts: Object.fromEntries(worldValues.map((world) => [world, 4])) as Record<WorldId, number>,
    unlockedAvatarIds: platformCatalog.avatars.map((avatar) => avatar.id),
    unlockedAccessoryIds: platformCatalog.accessories.map((accessory) => accessory.id),
    selectedAccessoryId: "cosmic-backpack",
    skillCorrect: { literal: 12, inference: 12, vocabulary: 12, sequence: 12, cause_effect: 12 },
    activeDayKeys: ["2026-07-20", "2026-07-21", "2026-07-22"],
  };
  await client.send(new PutCommand({ TableName: tableName, Item: { ...showcaseState, PK: userPartition("demo-luna"), SK: "REWARDS", entityType: "REWARD_STATE" } }));
  await client.send(new PutCommand({ TableName: tableName, Item: { PK: "SEED", SK: "REWARDS_SHOWCASE_V1", entityType: "SEED", createdAt: new Date().toISOString() } }));
  console.log("Perfil Luna creado con todos los mundos, cartas, personajes y juegos desbloqueados.");
}
