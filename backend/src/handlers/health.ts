import { handleRequest, json, type ApiEvent, type ApiResponse } from "../http/api";

export async function handler(event: ApiEvent): Promise<ApiResponse> {
  return handleRequest(event, async () =>
    json(200, { status: "ok", service: "story-teacher-api" }),
  );
}

