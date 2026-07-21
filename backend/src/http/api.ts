import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { ZodError } from "zod";
import type { ErrorResponse } from "@story-teacher/shared";
import { getConfig } from "../config";
import { ApplicationError } from "../domain/errors";

export type ApiEvent = APIGatewayProxyEventV2;
export type ApiResponse = APIGatewayProxyStructuredResultV2;

export function json(statusCode: number, body: unknown): ApiResponse {
  const config = getConfig();
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": config.allowedOrigin,
      "access-control-allow-headers":
        "Content-Type,X-Demo-User-Id,Idempotency-Key",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      vary: "Origin",
    },
    body: JSON.stringify(body),
  };
}

export function getRequestId(event: ApiEvent): string {
  return event.requestContext?.requestId ?? crypto.randomUUID();
}

export function requireDemoUser(event: ApiEvent): string {
  const userId = header(event, "x-demo-user-id");
  if (!userId || userId !== getConfig().allowedDemoUserId) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      400,
      "El perfil de demostración no es válido.",
    );
  }
  return userId;
}

export function requireIdempotencyKey(event: ApiEvent): string {
  const key = header(event, "idempotency-key")?.trim();
  if (!key || key.length < 16 || key.length > 64) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      400,
      "Falta una clave de idempotencia válida.",
    );
  }
  return key;
}

export function parseJsonBody(event: ApiEvent): unknown {
  if (!event.body) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      400,
      "El cuerpo de la solicitud es obligatorio.",
    );
  }
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(body);
  } catch (error) {
    throw new ApplicationError(
      "VALIDATION_ERROR",
      400,
      "El cuerpo debe ser JSON válido.",
      error,
    );
  }
}

export async function handleRequest(
  event: ApiEvent,
  action: () => Promise<ApiResponse>,
): Promise<ApiResponse> {
  const requestId = getRequestId(event);
  try {
    return await action();
  } catch (error) {
    const normalized = normalizeError(error);
    console.error(
      JSON.stringify({
        level: "ERROR",
        event: "request.failed",
        requestId,
        code: normalized.code,
        errorName: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    const response: ErrorResponse = {
      error: {
        code: normalized.code,
        message: normalized.message,
        requestId,
      },
    };
    return json(normalized.statusCode, response);
  }
}

function header(event: ApiEvent, name: string): string | undefined {
  const wanted = name.toLowerCase();
  const entry = Object.entries(event.headers ?? {}).find(
    ([key]) => key.toLowerCase() === wanted,
  );
  return entry?.[1];
}

function normalizeError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }
  if (error instanceof ZodError) {
    return new ApplicationError(
      "VALIDATION_ERROR",
      400,
      error.issues[0]?.message ?? "Los datos no son válidos.",
      error,
    );
  }
  return new ApplicationError(
    "INTERNAL_ERROR",
    500,
    "Ocurrió un error inesperado. Intentá nuevamente.",
    error,
  );
}

