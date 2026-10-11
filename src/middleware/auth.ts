import { NextFunction, Request, Response } from 'express';
import { HttpError } from './error-handler';
import { AuthTokenPayload, verifyAuthToken } from '../lib/jwt';
import { UserRole } from '../entities/user.entity';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Missing or malformed Authorization header');
  }
  try {
    req.user = verifyAuthToken(header.slice('Bearer '.length));
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, 'You do not have permission to perform this action');
    }
    next();
  };
}

// Allows req.user.id === resourceOwnerId OR one of the given roles.
export function requireSelfOrRole(resourceOwnerId: (req: Request) => number, ...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpError(401, 'Missing or malformed Authorization header');
    }
    if (req.user.id === resourceOwnerId(req) || roles.includes(req.user.role)) {
      next();
      return;
    }
    throw new HttpError(403, 'You do not have permission to perform this action');
  };
}
