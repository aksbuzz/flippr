import express from 'express';
import { validate } from '../middleware';
import { EnvironmentController } from './environments.controller';
import { toggleFlagSchema } from './environments.schema';

const router = express.Router();
const controller = new EnvironmentController();

router.patch('/:environmentId/flags/:flagKey', validate(toggleFlagSchema), controller.toggleFlag);

export default router;
