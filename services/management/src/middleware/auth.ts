import { createHash, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../common';
import { config } from '../config';

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Requires `Authorization: Bearer <ADMIN_API_TOKEN>` on every request it guards.
 * Disabled when no token is configured (development and tests); production startup
 * refuses to run without one (see index.ts).
 */
export const requireAdminToken = (req: Request, _res: Response, next: NextFunction) => {
  const expected = config.auth.adminToken;
  if (!expected) return next();

  const header = req.headers.authorization ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';

  // Compare fixed-length digests so the comparison is constant time regardless of input length.
  if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
    return next(new UnauthorizedError('Missing or invalid admin token'));
  }
  next();
};
