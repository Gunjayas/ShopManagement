// Carry safe HTTP details from business services to the central error handler.
export class AppError extends Error {
  // Preserve both a machine category and an optional business-rule code for API clients.
  public constructor(
    public readonly statusCode: 400 | 404 | 422,
    public readonly error: string,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}