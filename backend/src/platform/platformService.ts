import {
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import {
  platformCatalog,
  skillValues,
  userProfileSchema,
  type Activity,
  type ActivityType,
  type Congratulation,
  type CourseDashboard,
  type CourseSummary,
  type CreateDemoProfileInput,
  type GenerateStoryInput,
  type GameId,
  type Invite,
  type Mission,
  type RewardState,
  type Skill,
  type StudentProgress,
  type UserProfile,
} from "@story-teacher/shared";
import { ulid } from "ulid";
import type { AppConfig } from "../config";
import { ApplicationError } from "../domain/errors";
import type { StoredAttempt, StoryApplicationService } from "../domain/models";
import { coursePartition, userPartition } from "../repositories/dynamoStoryRepository";
import { emptyRewardState, normalizeRewardState } from "./rewards";

interface DbItem {
  PK: string;
  SK: string;
  entityType: string;
}

interface CourseItem extends DbItem {
  courseId: string;
  name: string;
  description: string;
  ownerUserId: string;
  createdAt: string;
}

interface MembershipItem extends DbItem {
  courseId: string;
  userId: string;
  role: "owner" | "student";
  joinedAt: string;
}

interface InviteItem extends DbItem, Invite {}

interface MissionItem extends DbItem, Mission {}

export class PlatformService {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: AppConfig,
    private readonly stories: StoryApplicationService,
  ) {}

  get catalog() {
    return platformCatalog;
  }

  async assertCourseMembership(userId: string, courseId: string): Promise<void> {
    await this.requireMembership(userId, courseId);
  }

  async listDemoProfiles(): Promise<UserProfile[]> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: { ":pk": "DEMO", ":prefix": "PROFILE#" },
      }),
    );
    return (response.Items ?? []).map((item) => userProfileSchema.parse(stripDb(item)));
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: userPartition(userId), SK: "PROFILE" },
      }),
    );
    const parsed = userProfileSchema.safeParse(stripDb(response.Item));
    if (!parsed.success) {
      throw new ApplicationError("FORBIDDEN", 403, "El perfil de demostración no existe.");
    }
    return parsed.data;
  }

  async createDemoStudent(input: CreateDemoProfileInput): Promise<UserProfile> {
    const slug = input.displayName
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("es")
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-|-$/gu, "")
      .slice(0, 20) || "explorador";
    const userId = `demo-${slug}-${ulid().slice(-8).toLocaleLowerCase("en")}`;
    const profile = userProfileSchema.parse({
      ...input,
      userId,
      role: "student",
      selectedAccessoryId: null,
    });
    await this.putProfile(profile);
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          ...emptyRewardState(),
          PK: userPartition(userId),
          SK: "REWARDS",
          entityType: "REWARD_STATE",
        },
      }),
    );
    return profile;
  }

  async updateProfile(
    userId: string,
    update: {
      displayName?: string | undefined;
      avatarId?: string | undefined;
      age?: number | undefined;
      favoriteTheme?: string | undefined;
      adultLabel?: UserProfile["adultLabel"] | undefined;
    },
  ): Promise<UserProfile> {
    const current = await this.getProfile(userId);
    if (current.role === "student" && update.avatarId) {
      const avatar = platformCatalog.avatars.find((candidate) => candidate.id === update.avatarId);
      const rewards = await this.getRewards(userId);
      if (!avatar || (!avatar.base && !rewards.unlockedAvatarIds.includes(avatar.id))) {
        throw new ApplicationError("FORBIDDEN", 403, "Ese personaje todavía no está desbloqueado.");
      }
    }
    const next = userProfileSchema.parse({ ...current, ...update, userId, role: current.role });
    await this.putProfile(next);
    return next;
  }

  async listCourses(userId: string): Promise<CourseSummary[]> {
    await this.getProfile(userId);
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": userPartition(userId),
          ":prefix": "COURSE#",
        },
      }),
    );
    const memberships = (response.Items ?? []) as MembershipItem[];
    return Promise.all(memberships.map((membership) => this.getCourseSummary(membership.courseId)));
  }

  async createCourse(
    userId: string,
    input: { name: string; description: string },
  ): Promise<CourseSummary> {
    await this.requireAdult(userId);
    const courseId = ulid();
    const createdAt = new Date().toISOString();
    const course: CourseItem = {
      PK: coursePartition(courseId),
      SK: "META",
      entityType: "COURSE",
      courseId,
      name: input.name.trim(),
      description: input.description.trim(),
      ownerUserId: userId,
      createdAt,
    };
    await this.client.send(new PutCommand({ TableName: this.config.tableName, Item: course }));
    await this.saveMembership(courseId, userId, "owner", createdAt);
    return this.getCourseSummary(courseId);
  }

  async getCourse(userId: string, courseId: string): Promise<CourseSummary> {
    await this.requireMembership(userId, courseId);
    return this.getCourseSummary(courseId);
  }

  async createInvite(userId: string, courseId: string): Promise<Invite> {
    const course = await this.requireOwner(userId, courseId);
    await this.revokeInviteRecord(courseId);
    const token = `${ulid()}${crypto.randomUUID().replaceAll("-", "")}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000).toISOString();
    const invite: InviteItem = {
      PK: `INVITE#${token}`,
      SK: "META",
      entityType: "INVITE",
      token,
      courseId,
      courseName: course.name,
      expiresAt,
      status: "active",
    };
    await this.client.send(new PutCommand({ TableName: this.config.tableName, Item: invite }));
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: { ...invite, PK: coursePartition(courseId), SK: "INVITE" },
      }),
    );
    return toInvite(invite);
  }

  async revokeInvite(userId: string, courseId: string): Promise<void> {
    await this.requireOwner(userId, courseId);
    await this.revokeInviteRecord(courseId);
  }

  async getActiveInvite(userId: string, courseId: string): Promise<Invite | null> {
    await this.requireOwner(userId, courseId);
    const response = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: coursePartition(courseId), SK: "INVITE" },
      }),
    );
    const item = response.Item as InviteItem | undefined;
    if (!item || item.status !== "active") return null;
    if (new Date(item.expiresAt).getTime() <= Date.now()) return null;
    return toInvite(item);
  }

  async getInvite(token: string): Promise<Invite> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: `INVITE#${token}`, SK: "META" },
      }),
    );
    const item = response.Item as InviteItem | undefined;
    if (!item) throw inviteError();
    const status = new Date(item.expiresAt).getTime() <= Date.now() ? "expired" : item.status;
    return { ...toInvite(item), status };
  }

  async joinCourse(userId: string, token: string): Promise<CourseSummary> {
    const profile = await this.getProfile(userId);
    if (profile.role !== "student") {
      throw new ApplicationError("FORBIDDEN", 403, "Sólo un alumno puede usar esta invitación.");
    }
    const invite = await this.getInvite(token);
    if (invite.status !== "active") throw inviteError();
    await this.saveMembership(invite.courseId, userId, "student", new Date().toISOString());
    return this.getCourseSummary(invite.courseId);
  }

  async listMissions(userId: string, courseId: string): Promise<Mission[]> {
    await this.requireMembership(userId, courseId);
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": coursePartition(courseId),
          ":prefix": "MISSION#",
        },
        ScanIndexForward: false,
      }),
    );
    return (response.Items as MissionItem[] | undefined ?? []).map((item) => stripDb(item)) as Mission[];
  }

  async createMission(
    userId: string,
    courseId: string,
    input: GenerateStoryInput,
    idempotencyKey: string,
  ): Promise<Mission> {
    await this.requireOwner(userId, courseId);
    const missionId = ulid();
    const story = await this.stories.createStory(userId, input, idempotencyKey, {
      courseId,
      missionId,
      source: "mission",
    });
    const mission: MissionItem = {
      PK: coursePartition(courseId),
      SK: `MISSION#${new Date().toISOString()}#${missionId}`,
      entityType: "MISSION",
      missionId,
      courseId,
      storyId: story.storyId,
      title: story.title,
      theme: story.input.theme,
      educationalObjective: story.input.educationalObjective,
      createdAt: story.createdAt,
      status: "active",
    };
    await this.client.send(new PutCommand({ TableName: this.config.tableName, Item: mission }));
    return stripDb(mission) as Mission;
  }

  async recordActivity(
    userId: string,
    courseId: string,
    input: { eventId: string; storyId: string; missionId?: string | undefined; type: ActivityType },
  ): Promise<Activity> {
    await this.requireStudentMembership(userId, courseId);
    const profile = await this.getProfile(userId);
    const createdAt = new Date().toISOString();
    const activity: Activity & DbItem = {
      PK: coursePartition(courseId),
      SK: `ACTIVITY#${createdAt}#${input.eventId}`,
      entityType: "ACTIVITY",
      activityId: input.eventId,
      courseId,
      userId,
      displayName: profile.displayName,
      storyId: input.storyId,
      missionId: input.missionId ?? null,
      type: input.type,
      createdAt,
      scorePercent: null,
    };
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: activity,
        ConditionExpression: "attribute_not_exists(PK)",
      }),
    ).catch((error: unknown) => {
      if (!(error instanceof Error) || error.name !== "ConditionalCheckFailedException") throw error;
    });
    return stripDb(activity) as Activity;
  }

  async getDashboard(userId: string, courseId: string): Promise<CourseDashboard> {
    await this.requireOwner(userId, courseId);
    const [course, members, missions, activity] = await Promise.all([
      this.getCourseSummary(courseId),
      this.listMemberProfiles(courseId),
      this.listMissions(userId, courseId),
      this.listActivity(courseId, 40),
    ]);
    const students = members.filter((member) => member.membershipRole === "student");
    const progress = await Promise.all(
      students.map((member) => this.getStudentProgress(userId, courseId, member.userId)),
    );
    const studentRows = progress.map(({ profile, attempts, recentActivity }) => {
      const latest = latestAttempts(attempts);
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        avatarId: profile.avatarId,
        completedMissions: new Set(latest.filter((item) => item.courseId === courseId && item.missionId).map((item) => item.missionId)).size,
        averageScore: average(latest.map((item) => item.scorePercent)),
        lastActivityAt: recentActivity[0]?.createdAt ?? null,
        focusSkill: focusSkill(latest.flatMap((item) => item.results)),
      };
    });
    const allLatest = progress.flatMap((item) => latestAttempts(item.attempts));
    const courseLatest = allLatest.filter((attempt) => attempt.courseId === courseId);
    const skillAccuracy = Object.fromEntries(
      skillValues.map((skill) => {
        const results = courseLatest.flatMap((attempt) => attempt.results).filter((result) => result.skill === skill);
        return [skill, percentage(results.filter((result) => result.isCorrect).length, results.length)];
      }),
    ) as Record<Skill, number>;
    const possible = students.length * missions.length;
    const completed = studentRows.reduce((sum, student) => sum + student.completedMissions, 0);
    return {
      course,
      activeStudents: studentRows.filter((student) => student.lastActivityAt).length,
      completionPercent: percentage(completed, possible),
      averageScore: average(courseLatest.map((attempt) => attempt.scorePercent)),
      skillAccuracy,
      students: studentRows,
      recentActivity: activity,
    };
  }

  async getStudentProgress(
    adultUserId: string,
    courseId: string,
    studentId: string,
  ): Promise<StudentProgress> {
    await this.requireOwner(adultUserId, courseId);
    await this.requireStudentMembership(studentId, courseId);
    const [profile, attempts, rewards, recentActivity] = await Promise.all([
      this.getProfile(studentId),
      this.listAttempts(studentId, courseId),
      this.getRewards(studentId),
      this.listActivity(courseId, 100),
    ]);
    return {
      profile,
      attempts: attempts.map((attempt) => ({
        attemptId: attempt.attemptId,
        storyId: attempt.storyId,
        createdAt: attempt.createdAt,
        correctCount: attempt.correctCount,
        scorePercent: attempt.scorePercent,
        results: attempt.results,
        rewardGrant: attempt.rewardGrant ?? null,
        storyTitle: attempt.storyTitle,
        theme: attempt.theme,
        courseId: attempt.courseId ?? null,
        missionId: attempt.missionId ?? null,
      })),
      rewards,
      recentActivity: recentActivity.filter((item) => item.userId === studentId),
    };
  }

  async sendCongratulation(
    adultUserId: string,
    courseId: string,
    studentId: string,
    input: {
      templateId?: string | undefined;
      message?: string | undefined;
      assetId: string;
      highlightedSkill?: Skill | undefined;
    },
  ): Promise<Congratulation> {
    const adult = await this.requireAdult(adultUserId);
    await this.requireOwner(adultUserId, courseId);
    await this.requireStudentMembership(studentId, courseId);
    const template = input.templateId
      ? platformCatalog.congratulations.find((item) => item.id === input.templateId)
      : undefined;
    const message = (input.message?.trim() || template?.description || "").slice(0, 160);
    if (!message || !isSafeAdultMessage(message)) {
      throw new ApplicationError("CONTENT_BLOCKED", 422, "La felicitación contiene datos o palabras que no podemos enviar.");
    }
    const createdAt = new Date().toISOString();
    const congratulation: Congratulation & DbItem = {
      PK: userPartition(studentId),
      SK: `CONGRATULATION#${createdAt}#${ulid()}`,
      entityType: "CONGRATULATION",
      congratulationId: ulid(),
      courseId,
      fromUserId: adultUserId,
      fromDisplayName: adult.displayName,
      toUserId: studentId,
      templateId: template?.id ?? null,
      message,
      assetId: input.assetId,
      highlightedSkill: input.highlightedSkill ?? null,
      createdAt,
    };
    await this.client.send(new PutCommand({ TableName: this.config.tableName, Item: congratulation }));
    return stripDb(congratulation) as Congratulation;
  }

  async listCongratulations(userId: string): Promise<Congratulation[]> {
    await this.getProfile(userId);
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": userPartition(userId),
          ":prefix": "CONGRATULATION#",
        },
        ScanIndexForward: false,
      }),
    );
    return (response.Items ?? []).map(stripDb) as Congratulation[];
  }

  async getRewards(userId: string): Promise<RewardState> {
    await this.getProfile(userId);
    const response = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: userPartition(userId), SK: "REWARDS" },
      }),
    );
    return normalizeRewardState(stripDb(response.Item));
  }

  async consumeCard(userId: string, cardId: string, gameId: GameId, sessionId: string): Promise<RewardState> {
    const profile = await this.getProfile(userId);
    if (profile.role !== "student") throw new ApplicationError("FORBIDDEN", 403, "Sólo un estudiante puede usar cartas.");
    const card = platformCatalog.cards.find((candidate) => candidate.id === cardId);
    if (!card || (card.gameId !== null && card.gameId !== gameId)) {
      throw new ApplicationError("VALIDATION_ERROR", 400, "Esa carta no funciona en este minijuego.");
    }
    const state = await this.getRewards(userId);
    if ((state.cardInventory[cardId] ?? 0) < 1) {
      throw new ApplicationError("FORBIDDEN", 403, "No quedan cargas de esa carta.");
    }
    try {
      await this.client.send(new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.config.tableName,
              Item: { PK: userPartition(userId), SK: `CARD_USE#${sessionId}`, entityType: "CARD_USE", cardId, gameId, createdAt: new Date().toISOString() },
              ConditionExpression: "attribute_not_exists(PK)",
            },
          },
          {
            Update: {
              TableName: this.config.tableName,
              Key: { PK: userPartition(userId), SK: "REWARDS" },
              UpdateExpression: "SET cardInventory.#card = cardInventory.#card - :one",
              ConditionExpression: "attribute_exists(cardInventory.#card) AND cardInventory.#card >= :one",
              ExpressionAttributeNames: { "#card": cardId },
              ExpressionAttributeValues: { ":one": 1 },
            },
          },
        ],
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "TransactionCanceledException") {
        const existing = await this.client.send(new GetCommand({ TableName: this.config.tableName, Key: { PK: userPartition(userId), SK: `CARD_USE#${sessionId}` } }));
        if (existing.Item?.cardId === cardId && existing.Item?.gameId === gameId) return this.getRewards(userId);
        throw new ApplicationError("FORBIDDEN", 409, existing.Item ? "Ya usaste una carta en esta partida." : "No quedan cargas de esa carta.");
      }
      throw error;
    }
    return this.getRewards(userId);
  }

  async selectAccessory(userId: string, accessoryId: string | null): Promise<RewardState> {
    const state = await this.getRewards(userId);
    if (accessoryId && !state.unlockedAccessoryIds.includes(accessoryId)) {
      throw new ApplicationError("FORBIDDEN", 403, "Ese accesorio todavía no está desbloqueado.");
    }
    const next = { ...state, selectedAccessoryId: accessoryId };
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: {
          ...next,
          PK: userPartition(userId),
          SK: "REWARDS",
          entityType: "REWARD_STATE",
        },
      }),
    );
    await this.client.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: { PK: userPartition(userId), SK: "PROFILE" },
        UpdateExpression: "SET selectedAccessoryId = :value",
        ExpressionAttributeValues: { ":value": accessoryId },
      }),
    );
    return next;
  }

  private async putProfile(profile: UserProfile): Promise<void> {
    const item = {
      ...profile,
      PK: userPartition(profile.userId),
      SK: "PROFILE",
      entityType: "USER",
    };
    await this.client.send(new PutCommand({ TableName: this.config.tableName, Item: item }));
    await this.client.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: { ...item, PK: "DEMO", SK: `PROFILE#${profile.userId}` },
      }),
    );
  }

  private async saveMembership(
    courseId: string,
    userId: string,
    role: "owner" | "student",
    joinedAt: string,
  ): Promise<void> {
    const base = { entityType: "MEMBERSHIP", courseId, userId, role, joinedAt };
    await Promise.all([
      this.client.send(
        new PutCommand({
          TableName: this.config.tableName,
          Item: { ...base, PK: coursePartition(courseId), SK: `MEMBER#${userId}` },
        }),
      ),
      this.client.send(
        new PutCommand({
          TableName: this.config.tableName,
          Item: { ...base, PK: userPartition(userId), SK: `COURSE#${courseId}` },
        }),
      ),
    ]);
  }

  private async getCourseItem(courseId: string): Promise<CourseItem> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: coursePartition(courseId), SK: "META" },
      }),
    );
    if (!response.Item) {
      throw new ApplicationError("COURSE_NOT_FOUND", 404, "No encontramos ese curso.");
    }
    return response.Item as CourseItem;
  }

  private async getCourseSummary(courseId: string): Promise<CourseSummary> {
    const [course, members, missions] = await Promise.all([
      this.getCourseItem(courseId),
      this.queryCoursePrefix(courseId, "MEMBER#"),
      this.queryCoursePrefix(courseId, "MISSION#"),
    ]);
    return {
      courseId,
      name: course.name,
      description: course.description,
      ownerUserId: course.ownerUserId,
      memberCount: members.filter((item) => item.role === "student").length,
      missionCount: missions.length,
      createdAt: course.createdAt,
    };
  }

  private async requireAdult(userId: string): Promise<UserProfile> {
    const profile = await this.getProfile(userId);
    if (profile.role !== "adult") {
      throw new ApplicationError("FORBIDDEN", 403, "Esta acción requiere un perfil adulto.");
    }
    return profile;
  }

  private async requireOwner(userId: string, courseId: string): Promise<CourseItem> {
    await this.requireAdult(userId);
    const course = await this.getCourseItem(courseId);
    if (course.ownerUserId !== userId) {
      throw new ApplicationError("FORBIDDEN", 403, "No administrás este curso.");
    }
    return course;
  }

  private async requireMembership(userId: string, courseId: string): Promise<MembershipItem> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: coursePartition(courseId), SK: `MEMBER#${userId}` },
      }),
    );
    if (!response.Item) {
      throw new ApplicationError("FORBIDDEN", 403, "No pertenecés a este curso.");
    }
    return response.Item as MembershipItem;
  }

  private async requireStudentMembership(userId: string, courseId: string): Promise<void> {
    const [profile, membership] = await Promise.all([
      this.getProfile(userId),
      this.requireMembership(userId, courseId),
    ]);
    if (profile.role !== "student" || membership.role !== "student") {
      throw new ApplicationError("FORBIDDEN", 403, "El alumno no pertenece a este curso.");
    }
  }

  private async listMemberProfiles(
    courseId: string,
  ): Promise<Array<UserProfile & { membershipRole: "owner" | "student" }>> {
    const memberships = (await this.queryCoursePrefix(
      courseId,
      "MEMBER#",
    )) as unknown as MembershipItem[];
    return Promise.all(
      memberships.map(async (membership) => ({
        ...(await this.getProfile(membership.userId)),
        membershipRole: membership.role,
      })),
    );
  }

  private async listAttempts(userId: string, courseId?: string): Promise<StoredAttempt[]> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": userPartition(userId),
          ":prefix": "ATTEMPT#",
        },
        ScanIndexForward: false,
      }),
    );
    const attempts = (response.Items ?? []) as StoredAttempt[];
    return courseId ? attempts.filter((attempt) => attempt.courseId === courseId) : attempts;
  }

  private async listActivity(courseId: string, limit: number): Promise<Activity[]> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: {
          ":pk": coursePartition(courseId),
          ":prefix": "ACTIVITY#",
        },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (response.Items ?? []).map(stripDb) as Activity[];
  }

  private async queryCoursePrefix(courseId: string, prefix: string): Promise<Record<string, unknown>[]> {
    const response = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        ExpressionAttributeValues: { ":pk": coursePartition(courseId), ":prefix": prefix },
      }),
    );
    return response.Items ?? [];
  }

  private async revokeInviteRecord(courseId: string): Promise<void> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { PK: coursePartition(courseId), SK: "INVITE" },
      }),
    );
    const current = response.Item as InviteItem | undefined;
    if (!current) return;
    const revoked = { ...current, status: "revoked" as const };
    await Promise.all([
      this.client.send(new PutCommand({ TableName: this.config.tableName, Item: revoked })),
      this.client.send(
        new PutCommand({
          TableName: this.config.tableName,
          Item: { ...revoked, PK: `INVITE#${current.token}`, SK: "META" },
        }),
      ),
    ]);
  }
}

function stripDb(value: object | undefined): Record<string, unknown> {
  if (!value) return {};
  const { PK: _pk, SK: _sk, entityType: _type, ...rest } = value as Record<string, unknown>;
  return rest;
}

function toInvite(item: InviteItem): Invite {
  return {
    token: item.token,
    courseId: item.courseId,
    courseName: item.courseName,
    expiresAt: item.expiresAt,
    status: item.status,
  };
}

function inviteError(): ApplicationError {
  return new ApplicationError("INVITE_INVALID", 404, "La invitación venció o ya no está disponible.");
}

function latestAttempts<T extends { storyId: string; createdAt: string }>(attempts: T[]): T[] {
  const latest = new Map<string, T>();
  for (const attempt of attempts) {
    const current = latest.get(attempt.storyId);
    if (!current || current.createdAt < attempt.createdAt) latest.set(attempt.storyId, attempt);
  }
  return [...latest.values()];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentage(value: number, total: number): number {
  return total ? Math.round((value / total) * 100) : 0;
}

function focusSkill(results: Array<{ skill: Skill; isCorrect: boolean }>): Skill | null {
  if (!results.length) return null;
  const accuracy = skillValues.map((skill) => {
    const matching = results.filter((result) => result.skill === skill);
    return { skill, value: percentage(matching.filter((item) => item.isCorrect).length, matching.length) };
  });
  return accuracy.sort((a, b) => a.value - b.value)[0]?.skill ?? null;
}

export function isSafeAdultMessage(message: string): boolean {
  const normalized = message.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
  const blocked = ["sexo", "sexual", "matar", "violencia", "odio", "idiota", "estupido", "direccion", "contraseña"];
  if (blocked.some((term) => normalized.includes(term))) return false;
  if (/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/iu.test(message)) return false;
  if (/(?:\+?\d[\s().-]*){8,}/u.test(message)) return false;
  if (/\b(?:https?:\/\/|www\.)\S+/iu.test(message)) return false;
  return true;
}
