import {
  activityTypeSchema,
  createDemoProfileSchema,
  gameIdSchema,
  skillSchema,
  storyInputSchema,
} from "@story-teacher/shared";
import { z } from "zod";
import { getPlatformService } from "../container";
import { ApplicationError } from "../domain/errors";
import {
  handleRequest,
  json,
  parseJsonBody,
  requireDemoUser,
  requireIdempotencyKey,
  type ApiEvent,
  type ApiResponse,
} from "../http/api";

const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(40).optional(),
    avatarId: z.string().min(1).max(40).optional(),
    age: z.number().int().min(6).max(12).optional(),
    favoriteTheme: z.string().trim().min(2).max(60).optional(),
    adultLabel: z.enum(["Profesor/a", "Familia"]).optional(),
  })
  .strict();

const courseInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(240).default(""),
  })
  .strict();

const activityInputSchema = z
  .object({
    eventId: z.string().min(10).max(64),
    storyId: z.string().min(10).max(64),
    missionId: z.string().min(10).max(64).optional(),
    type: activityTypeSchema.exclude(["attempt_completed"]),
  })
  .strict();

const congratulationInputSchema = z
  .object({
    templateId: z.string().max(60).optional(),
    message: z.string().trim().max(160).optional(),
    assetId: z.string().min(2).max(60),
    highlightedSkill: skillSchema.optional(),
  })
  .strict();

const accessorySchema = z.object({ accessoryId: z.string().nullable() }).strict();
const cardUseSchema = z.object({ gameId: gameIdSchema, sessionId: z.string().min(8).max(64) }).strict();

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const service = getPlatformService();
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    if (method === "GET" && path === "/demo/profiles") {
      return json(200, { items: await service.listDemoProfiles() });
    }
    if (method === "POST" && path === "/demo/profiles") {
      return json(201, await service.createDemoStudent(createDemoProfileSchema.parse(parseJsonBody(event))));
    }
    if (method === "GET" && path === "/catalog") {
      return json(200, service.catalog);
    }

    const inviteMatch = path.match(/^\/invites\/([^/]+)$/u);
    if (method === "GET" && inviteMatch?.[1]) {
      return json(200, await service.getInvite(inviteMatch[1]));
    }

    const userId = requireDemoUser(event);

    if (method === "GET" && path === "/me") {
      return json(200, await service.getProfile(userId));
    }
    if (method === "PATCH" && path === "/me") {
      return json(200, await service.updateProfile(userId, updateProfileSchema.parse(parseJsonBody(event))));
    }
    if (method === "GET" && path === "/me/rewards") {
      return json(200, await service.getRewards(userId));
    }
    if (method === "PATCH" && path === "/me/rewards/accessory") {
      const { accessoryId } = accessorySchema.parse(parseJsonBody(event));
      return json(200, await service.selectAccessory(userId, accessoryId));
    }
    const cardUseMatch = path.match(/^\/me\/rewards\/cards\/([^/]+)\/consume$/u);
    if (method === "POST" && cardUseMatch?.[1]) {
      const { gameId, sessionId } = cardUseSchema.parse(parseJsonBody(event));
      return json(200, await service.consumeCard(userId, cardUseMatch[1], gameId, sessionId));
    }
    if (method === "GET" && path === "/me/congratulations") {
      return json(200, { items: await service.listCongratulations(userId) });
    }
    if (method === "GET" && path === "/courses") {
      return json(200, { items: await service.listCourses(userId) });
    }
    if (method === "POST" && path === "/courses") {
      return json(201, await service.createCourse(userId, courseInputSchema.parse(parseJsonBody(event))));
    }
    if (method === "POST" && inviteMatch?.[1] && path.endsWith("/join")) {
      return json(200, await service.joinCourse(userId, inviteMatch[1]));
    }
    const joinMatch = path.match(/^\/invites\/([^/]+)\/join$/u);
    if (method === "POST" && joinMatch?.[1]) {
      return json(200, await service.joinCourse(userId, joinMatch[1]));
    }

    const courseMatch = path.match(/^\/courses\/([^/]+)$/u);
    if (method === "GET" && courseMatch?.[1]) {
      return json(200, await service.getCourse(userId, courseMatch[1]));
    }
    const inviteAction = path.match(/^\/courses\/([^/]+)\/invite(?:\/(revoke))?$/u);
    if (method === "POST" && inviteAction?.[1] && inviteAction[2] === "revoke") {
      await service.revokeInvite(userId, inviteAction[1]);
      return json(204, null);
    }
    if (method === "POST" && inviteAction?.[1]) {
      return json(201, await service.createInvite(userId, inviteAction[1]));
    }
    const missionsMatch = path.match(/^\/courses\/([^/]+)\/missions$/u);
    if (method === "GET" && missionsMatch?.[1]) {
      return json(200, { items: await service.listMissions(userId, missionsMatch[1]) });
    }
    if (method === "POST" && missionsMatch?.[1]) {
      return json(201, await service.createMission(
        userId,
        missionsMatch[1],
        storyInputSchema.parse(parseJsonBody(event)),
        requireIdempotencyKey(event),
      ));
    }
    const activityMatch = path.match(/^\/courses\/([^/]+)\/activity-events$/u);
    if (method === "POST" && activityMatch?.[1]) {
      return json(201, await service.recordActivity(
        userId,
        activityMatch[1],
        activityInputSchema.parse(parseJsonBody(event)),
      ));
    }
    const dashboardMatch = path.match(/^\/courses\/([^/]+)\/dashboard$/u);
    if (method === "GET" && dashboardMatch?.[1]) {
      return json(200, await service.getDashboard(userId, dashboardMatch[1]));
    }
    const progressMatch = path.match(/^\/courses\/([^/]+)\/students\/([^/]+)\/progress$/u);
    if (method === "GET" && progressMatch?.[1] && progressMatch[2]) {
      return json(200, await service.getStudentProgress(userId, progressMatch[1], progressMatch[2]));
    }
    const congratulationsMatch = path.match(/^\/courses\/([^/]+)\/students\/([^/]+)\/congratulations$/u);
    if (method === "POST" && congratulationsMatch?.[1] && congratulationsMatch[2]) {
      return json(201, await service.sendCongratulation(
        userId,
        congratulationsMatch[1],
        congratulationsMatch[2],
        congratulationInputSchema.parse(parseJsonBody(event)),
      ));
    }

    throw new ApplicationError("VALIDATION_ERROR", 404, "La ruta solicitada no existe.");
  });
}
