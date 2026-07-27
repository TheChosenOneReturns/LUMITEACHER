import type { ErrorCode } from "@story-teacher/shared";

export class ApplicationError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly statusCode: number,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class StoryNotFoundError extends ApplicationError {
  constructor() {
    super("STORY_NOT_FOUND", 404, "No encontramos esa aventura.");
  }
}

export class AttemptAlreadyExistsError extends ApplicationError {
  constructor(cause?: unknown) {
    super(
      "ATTEMPT_ALREADY_EXISTS",
      409,
      "Ese intento ya fue enviado.",
      cause,
    );
  }
}

export class DuplicateStoryError extends Error {
  constructor(readonly cause?: unknown) {
    super("La clave de idempotencia ya existe.");
    this.name = "DuplicateStoryError";
  }
}

export class ContentBlockedError extends ApplicationError {
  constructor(cause?: unknown) {
    super(
      "CONTENT_BLOCKED",
      422,
      "Ese tema no puede usarse. Probá con otra idea para tu aventura.",
      cause,
    );
  }
}

export class GenerationFailedError extends ApplicationError {
  constructor(cause?: unknown) {
    super(
      "GENERATION_FAILED",
      502,
      "Lumi no pudo terminar la aventura. Intentá nuevamente.",
      cause,
    );
  }
}

export class GenerationTimeoutError extends ApplicationError {
  constructor(cause?: unknown) {
    super(
      "GENERATION_TIMEOUT",
      504,
      "La aventura tardó demasiado. Intentá nuevamente.",
      cause,
    );
  }
}

export class GenerationLimitError extends ApplicationError {
  constructor(cause?: unknown) {
    super(
      "GENERATION_LIMIT",
      429,
      "Llegaste al límite de aventuras nuevas por hoy. ¡Mañana seguimos!",
      cause,
    );
  }
}

