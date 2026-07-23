import { createStoryRequestSchema } from "@story-teacher/shared";
import { getPlatformService, getStoryService } from "../container";
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

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const userId = requireDemoUser(event);
    const idempotencyKey = requireIdempotencyKey(event);
    const request = createStoryRequestSchema.parse(parseJsonBody(event));
    const { courseId, ...input } = request;
    const platform = getPlatformService();
    const profile = await platform.getProfile(userId);
    if (profile.role !== "student") {
      throw new ApplicationError("FORBIDDEN", 403, "Los cuentos libres pertenecen a perfiles de estudiante.");
    }
    if (courseId) await platform.assertCourseMembership(userId, courseId);
    const story = await getStoryService().createStory(
      userId,
      input,
      idempotencyKey,
      courseId ? { courseId, source: "free" } : undefined,
    );
    return json(201, story);
  });
}
