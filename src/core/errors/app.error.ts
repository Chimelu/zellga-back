export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 400,
    code = "APP_ERROR",
    isOperational = true
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(message, 409, code);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Invalid credentials", code = "UNAUTHORIZED") {
    super(message, 401, code);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", code = "NOT_FOUND") {
    super(message, 404, code);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 422, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.details = details;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN") {
    super(message, 403, code);
    this.name = "ForbiddenError";
  }
}
