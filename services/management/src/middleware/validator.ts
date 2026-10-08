import { NextFunction, Request, Response } from 'express';
import { ZodType, ZodError } from 'zod';
import { errorResponse } from '../common';

type ValidationSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export const validate =
  (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, ZodError> = {};

    if (schemas.body) {
      const bodyResult = schemas.body.safeParse(req.body);
      if (!bodyResult.success) {
        errors.body = bodyResult.error;
      } else {
        req.body = bodyResult.data;
      }
    }

    if (schemas.params) {
      const paramsResult = schemas.params.safeParse(req.params);
      if (!paramsResult.success) {
        errors.params = paramsResult.error;
      } else {
        req.params = paramsResult.data as Record<string, string>;
      }
    }

    if (schemas.query) {
      const queryResult = schemas.query.safeParse(req.query);
      if (!queryResult.success) {
        errors.query = queryResult.error;
      } else {
        // Express 5 exposes req.query as a getter-only property, so plain assignment throws.
        Object.defineProperty(req, 'query', {
          value: queryResult.data,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    }

    if (Object.keys(errors).length > 0) {
      req.log.error({ errors, url: req.url, method: req.method }, 'Validation error occurred');
      return res.status(400).json(
        errorResponse(
          'Validation failed',
          Object.entries(errors).reduce(
            (acc, [key, error]) => ({ ...acc, [key]: error.message }),
            {}
          )
        )
      );
    }

    next();
  };
