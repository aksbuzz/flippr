import { NextFunction, Request, Response } from 'express';
import { okResponse } from '../common';
import { ToggleFlagSchema } from './environments.schema';
import { EnvironmentService } from './environments.service';

export class EnvironmentController {
  constructor(private readonly environmentService = new EnvironmentService()) {}

  toggleFlag = async (
    req: Request<{ environmentId: string; flagKey: string }, any, ToggleFlagSchema>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const environmentId = parseInt(req.params.environmentId);
      const flagKey = req.params.flagKey;

      const flag = await this.environmentService.toggleFlag(
        environmentId,
        flagKey,
        req.body.is_enabled
      );

      res.status(200).json(okResponse(flag));
    } catch (err: any) {
      next(err);
    }
  };
}
