export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "unauthorized", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "forbidden", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, "not_found", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, "conflict", 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limited") {
    super(message, "rate_limited", 429);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = "Validation failed") {
    super(message, "validation_error", 422, details);
  }
}

export class ProviderError extends AppError {
  constructor(message: string, public readonly retryable: boolean, details?: unknown) {
    super(message, "provider_error", 502, details);
  }
}
