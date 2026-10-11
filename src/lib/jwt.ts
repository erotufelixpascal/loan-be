import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../entities/user.entity';

export interface AuthTokenPayload {
  id: number;
  email: string;
  role: UserRole;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwt.secret) as AuthTokenPayload;
}
