import { createStoryRequestSchema } from "@story-teacher/shared";
import { createHash } from "node:crypto";
import { ulid } from "ulid";
import {
  getGenerationDispatcher,
  getGenerationJobRepository,
  getPlatformService,
} from "../container";
import { ApplicationError } from "../domain/errors";
import {
  handleRequest,
  json,
  parseJsonBody,
  requireUser,
  requireIdempotencyKey,
  type ApiEvent,
  type ApiResponse,
} from "../http/api";

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const { userId } = await requireUser(event);
    const idempotencyKey = requireIdempotencyKey(event);
    const request = createStoryRequestSchema.parse(parseJsonBody(event));
    const { courseId, ...input } = request;
    const platform = getPlatformService();
    const profile = await platform.getProfile(userId);
    if (profile.role === "adult") {
      if (!courseId) {
        throw new ApplicationError(
          "VALIDATION_ERROR",
          400,
          "Elegí un curso para generar la vista previa de la misión.",
        );
      }
      await platform.assertCourseOwner(userId, courseId);
    } else if (courseId) {
      await platform.assertCourseMembership(userId, courseId);
    }
    const generationId = createHash("sha256")
      .update(`${userId}\0${idempotencyKey}`)
      .digest("hex")
      .slice(0, 32);
    const missionId = profile.role === "adult" ? ulid() : undefined;
    const workerEvent = {
      generationId,
      userId,
      input,
      idempotencyKey,
      context: profile.role === "adult"
        ? {
            courseId: courseId!,
            missionId: missionId!,
            source: "mission" as const,
          }
        : courseId
          ? { courseId, source: "free" as const }
        : { source: "free" as const },
    };
    const jobs = getGenerationJobRepository();
    const result = await jobs.createPending(workerEvent);
    if (result.created) {
      try {
        await getGenerationDispatcher().dispatch(workerEvent);
      } catch (error) {
        await jobs.markFailed(userId, generationId, {
          code: "GENERATION_FAILED",
          message:
            "No pudimos iniciar la creación de la aventura. Intentá nuevamente.",
        });
        throw error;
      }
    }
    return json(202, { generationId, status: "pending" });
  });
}
