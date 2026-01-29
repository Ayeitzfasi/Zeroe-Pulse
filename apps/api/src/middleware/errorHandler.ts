import { Request, Response, NextFunction } from 'express';
import type { ApiError } from '@zeroe-pulse/shared';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const apiError: ApiError = {
      code: err.code,
      message: err.message,
      details: err.details,
    };

    return res.status(err.statusCode).json({
      success: false,
      error: apiError,
    });
  }

  // Generic error
  const apiError: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  };

  return res.status(500).json({
    success: false,
    error: apiError,
  });
}
