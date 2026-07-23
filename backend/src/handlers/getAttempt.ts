import { ApplicationError } from "../domain/errors";
import { getStoryService } from "../container";
import {
  handleRequest,
  json,
  requireDemoUser,
  type ApiEvent,
  type ApiResponse,
} from "../http/api";

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () => {
    const userId = requireDemoUser(event);
    const attemptId = event.pathParameters?.attemptId;
    if (!attemptId) {
      throw new ApplicationError(
        "VALIDATION_ERROR",
        400,
        "Falta el identificador del intento.",
      );
    }
    return json(200, await getStoryService().getAttempt(userId, attemptId));
  });
}
