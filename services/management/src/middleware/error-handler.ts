import { Request, Response, NextFunction } from 'express';
import { ApplicationError, errorResponse } from '../common';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApplicationError) {
    _req.log.error({ err, url: _req.url, method: _req.method }, 'Application error occurred');
    return res.status(err.statusCode).json(errorResponse(err.message));
  }

  _req.log.error({ err, url: _req.url, method: _req.method }, 'Unexpected error occurred');

  res.status(500).json(errorResponse('Internal Server Error'));
};
