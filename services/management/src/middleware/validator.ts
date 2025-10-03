import { NextFunction, Request, Response } from 'express';
import { ZodObject } from 'zod';
import { errorResponse } from '../common';

export const validate =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      req.log.error(
        { err: result.error, url: req.url, method: req.method },
        'Validation error occurred'
      );
      return res.status(400).json(errorResponse(result.error.message));
    }

    req.body = result.data;
    next();
  };
