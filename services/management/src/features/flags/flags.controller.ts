import { NextFunction, Request, Response } from 'express';
import { okResponse } from '../../common';
import { FlagsService } from './flags.service';
import { CreateFlagVariant, UpdateFlagState } from './flags.types';

export class FlagsController {
  constructor(private readonly flagsService = new FlagsService()) {}

  getVariants = async (req: Request<{ flagId: string }>, res: Response, next: NextFunction) => {
    try {
      const { flagId } = req.params;
      const variants = await this.flagsService.getVariants(flagId);
      res.status(200).json(okResponse(variants));
    } catch (err: any) {
      next(err);
    }
  };

  createVariant = async (
    req: Request<{ flagId: string }, any, CreateFlagVariant>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { flagId } = req.params;
      const variant = await this.flagsService.createVariant(flagId, req.body);
      res.status(201).json(okResponse(variant));
    } catch (err: any) {
      next(err);
    }
  };

  deleteVariant = async (
    req: Request<{ flagId: string; variantId: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { flagId, variantId } = req.params;
      await this.flagsService.deleteVariant(flagId, variantId);
      res.status(200).json(okResponse({ flagId, variantId }));
    } catch (err: any) {
      next(err);
    }
  };

  updateFlagState = async (
    req: Request<{ environmentId: string; flagId: string }, any, UpdateFlagState>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { environmentId, flagId } = req.params;
      const flag = await this.flagsService.updateFlagState(flagId, environmentId, req.body);
      res.status(200).json(okResponse(flag));
    } catch (error) {
      next(error);
    }
  };
}
