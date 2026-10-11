import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 400, code = 'APP_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // 1. Zod validation errors
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', formatted);
    return;
  }

  // 2. Custom AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // 3. Prisma database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      sendError(res, `A record with this ${target} already exists`, 409, 'CONFLICT');
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found in database', 404, 'NOT_FOUND');
      return;
    }
    if (err.code === 'P2003') {
      sendError(res, 'Foreign key relationship constraint failed', 400, 'FOREIGN_KEY_VIOLATION');
      return;
    }
    sendError(res, `Database error: ${err.message}`, 500, 'DATABASE_ERROR');
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    sendError(
      res,
      'Database connection could not be established. Please ensure PostgreSQL is running and DATABASE_URL is configured.',
      503,
      'DATABASE_UNAVAILABLE'
    );
    return;
  }

  // 4. Fallback unknown error
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (env.NODE_ENV !== 'test') {
    console.error('💥 Unhandled error on request', req.method, req.originalUrl, err);
  }

  sendError(
    res,
    env.NODE_ENV === 'production' ? 'Internal server error' : message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
}
