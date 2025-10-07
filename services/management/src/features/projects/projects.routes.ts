import express from 'express';
import { validate } from '../../middleware';
import { ProjectsController } from './projects.controller';
import {
  createEnvironmentBodySchema,
  createFlagBodySchema,
  createProjectBodySchema,
  getFlagParamSchema,
  projectIdSchema,
} from './projects.schema';

const router = express.Router();
const projectsController = new ProjectsController();

router.post('/', validate({ body: createProjectBodySchema }), projectsController.createProject);
router.get('/', projectsController.getProjects);

router.post(
  '/:projectId/environments',
  validate({ params: projectIdSchema, body: createEnvironmentBodySchema }),
  projectsController.createEnvironment
);
router.get(
  '/:projectId/environments',
  validate({ params: projectIdSchema }),
  projectsController.getEnvironments
);

router.post(
  '/:projectId/flags',
  validate({ params: projectIdSchema, body: createFlagBodySchema }),
  projectsController.createFlag
);
router.get('/:projectId/flags', validate({ params: projectIdSchema }), projectsController.getFlags);
router.get(
  '/:projectId/flags/:flagId',
  validate({ params: getFlagParamSchema }),
  projectsController.getFlag
);

export default router;
