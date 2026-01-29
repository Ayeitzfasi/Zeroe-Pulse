import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '@zeroe-pulse/shared';
import { AppError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function generateToken(payload: AuthTokenPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(401, 'UNAUTHORIZED', 'No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid authorization header format');
    }

    const token = parts[1];
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'TOKEN_EXPIRED', 'Token has expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'INVALID_TOKEN', 'Invalid token'));
    } else {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication failed'));
    }
  }
}
