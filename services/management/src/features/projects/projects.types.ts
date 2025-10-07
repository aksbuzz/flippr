import z from 'zod';
import {
  createEnvironmentBodySchema,
  createFlagBodySchema,
  createProjectBodySchema,
} from './projects.schema';

export type CreateProject = z.infer<typeof createProjectBodySchema>;
export type CreateEnvironment = z.infer<typeof createEnvironmentBodySchema>;
export type CreateFlag = z.infer<typeof createFlagBodySchema>;
