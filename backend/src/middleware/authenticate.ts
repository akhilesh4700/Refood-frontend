import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { prisma } from '../lib/prisma';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Invalid token format.', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
      organizationId: string;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired. Please sign in again.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid or corrupted authentication token.', 401, 'INVALID_TOKEN');
  }
}

/**
 * Optional authentication: attaches user if token is present and valid,
 * but allows unauthenticated access if no token was provided.
 */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
      organizationId: string;
    };
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };
  } catch {
    // Ignore invalid token for optional endpoints
  }
  next();
}
