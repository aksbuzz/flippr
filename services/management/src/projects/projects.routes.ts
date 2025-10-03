import express from 'express';
import { ProjectsController } from './projects.controller';

const router = express.Router();
const projectsController = new ProjectsController()

router.post('/', projectsController.createProject);
router.post('/:projectId/environments', projectsController.createEnvironment);
router.post('/:projectId/flags', projectsController.createFlag);
router.get('/:projectId/flags', projectsController.getFlags);

export default router;