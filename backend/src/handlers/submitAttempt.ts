import { submitAttemptSchema } from "@story-teacher/shared";
import { getPlatformService, getStoryService } from "../container";
import { ApplicationError } from "../domain/errors";
import {
  handleRequest,
  json,
  parseJsonBody,
  requireUser,
  type ApiEvent,
  type ApiResponse,
} from "../http/api";

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const { userId } = await requireUser(event);
    const profile = await getPlatformService().getProfile(userId);
    if (profile.role !== "student") {
      throw new ApplicationError("FORBIDDEN", 403, "Sólo un estudiante puede completar desafíos.");
    }
    const storyId = event.pathParameters?.storyId;
    if (!storyId) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        400,
        "Falta el identificador de la aventura.",
      );
    }
    const input = submitAttemptSchema.parse(parseJsonBody(event));
    const result = await getStoryService().submitAttempt(
      userId,
      storyId,
      input,
    );
    return json(201, result);
  });
}
