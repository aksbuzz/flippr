import express from 'express';
import { validate } from '../../middleware';
import { FlagsController } from './flags.controller';
import {
  createFlagVariantBodySchema,
  createFlagVariantParamsSchema,
  deleteFlagVariantParamsSchema,
  getFlagVariantsParamsSchema,
  updateFlagStateBodySchema,
  updateFlagStateParamsSchema,
} from './flags.schema';

const router = express.Router();
const flagsController = new FlagsController();

router.get(
  '/:flagId/variants',
  validate({ params: getFlagVariantsParamsSchema }),
  flagsController.getVariants
);

router.post(
  '/:flagId/variants',
  validate({ params: createFlagVariantParamsSchema, body: createFlagVariantBodySchema }),
  flagsController.createVariant
);
router.delete(
  '/:flagId/variants/:variantId',
  validate({ params: deleteFlagVariantParamsSchema }),
  flagsController.deleteVariant
);

router.patch(
  '/:flagId/environments/:environmentId',
  validate({ params: updateFlagStateParamsSchema, body: updateFlagStateBodySchema }),
  flagsController.updateFlagState
);

export default router;
