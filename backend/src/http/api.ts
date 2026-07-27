import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { ZodError } from "zod";
import type { ErrorResponse } from "@story-teacher/shared";
import { getSessionIpGuard } from "../container";
import { getConfig } from "../config";
import { ApplicationError } from "../domain/errors";
import type { AuthenticatedIdentity } from "../domain/models";

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
        "Authorization,Content-Type,X-Demo-User-Id,Idempotency-Key",
      "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
      "cache-control": "no-store",
      "permissions-policy": "camera=(), geolocation=(), microphone=()",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      vary: "Origin",
    },
    body: JSON.stringify(body),
  };
}

export function getRequestId(event: ApiEvent): string {
  return event.requestContext?.requestId ?? crypto.randomUUID();
}

export async function requireUser(
  event: ApiEvent,
): Promise<AuthenticatedIdentity> {
  const config = getConfig();
  if (config.authMode === "demo") {
    const userId = header(event, "x-demo-user-id")?.trim();
    if (!userId || !/^[a-z0-9][a-z0-9-]{2,63}$/u.test(userId)) {
      throw new ApplicationError(
        "UNAUTHORIZED",
        401,
        "Elegí un perfil de demostración para continuar.",
      );
    }
    return { userId };
  }

  const authorizer = (
    event.requestContext as unknown as {
      authorizer?: { jwt?: { claims?: Record<string, unknown> } };
    }
  ).authorizer as
    | { jwt?: { claims?: Record<string, unknown> } }
    | undefined;
  const claims = authorizer?.jwt?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : undefined;
  if (!userId) {
    throw new ApplicationError(
      "UNAUTHORIZED",
      401,
      "La sesión venció o no es válida. Volvé a ingresar.",
    );
  }
  const rawExpiration = claims?.exp;
  const expiresAtEpochSeconds =
    typeof rawExpiration === "number"
      ? rawExpiration
      : typeof rawExpiration === "string"
        ? Number.parseInt(rawExpiration, 10)
        : undefined;
  const sessionIdCandidate = claims?.origin_jti ?? claims?.jti;
  const identity: AuthenticatedIdentity = {
    userId,
    ...(typeof sessionIdCandidate === "string"
      ? { sessionId: sessionIdCandidate }
      : {}),
    ...(typeof expiresAtEpochSeconds === "number" &&
    Number.isFinite(expiresAtEpochSeconds)
      ? { expiresAtEpochSeconds }
      : {}),
  };
  const userAgent = header(event, "user-agent");
  await getSessionIpGuard().assertContext(identity, {
    sourceIp: event.requestContext.http.sourceIp,
    ...(userAgent ? { userAgent } : {}),
  });
  return identity;
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
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "access-control-allow-origin": getConfig().allowedOrigin,
        "access-control-allow-headers":
          "Authorization,Content-Type,X-Demo-User-Id,Idempotency-Key",
        "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
        "access-control-max-age": "600",
        vary: "Origin",
      },
    };
  }
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
        errorMessage:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Error no serializable",
        awsRequestId: awsRequestId(error),
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

function awsRequestId(error: unknown): string | undefined {
  if (
    typeof error !== "object" ||
    error === null ||
    !("$metadata" in error)
  ) {
    return undefined;
  }
  const metadata = (error as { $metadata?: { requestId?: unknown } }).$metadata;
  return typeof metadata?.requestId === "string"
    ? metadata.requestId
    : undefined;
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
