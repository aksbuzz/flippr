import express from 'express';
import { ProjectsController } from './projects.controller';
import { validate } from '../middleware';
import { createEnvironmentSchema, createFlagSchema, createProjectSchema } from './projects.schema';

const router = express.Router();
const projectsController = new ProjectsController();

router.post('/', validate(createProjectSchema), projectsController.createProject);
router.get('/', projectsController.getProjects);

router.post(
  '/:projectId/environments',
  validate(createEnvironmentSchema),
  projectsController.createEnvironment
);
router.get('/:projectId/environments', projectsController.getEnvironments);

router.post('/:projectId/flags', validate(createFlagSchema), projectsController.createFlag);
router.get('/:projectId/flags', projectsController.getFlags);

export default router;
