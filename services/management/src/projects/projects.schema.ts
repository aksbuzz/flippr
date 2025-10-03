import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export type CreateProjectSchema = z.infer<typeof createProjectSchema>;

export const createEnvironmentSchema = z.object({
  name: z.string().min(1, 'Environment name is required'),
});

export type CreateEnvironmentSchema = z.infer<typeof createEnvironmentSchema>;

export const createFlagSchema = z.object({
  name: z.string().min(1, 'Flag name is required'),
  key: z.string().min(1, 'Flag key is required'),
  description: z.string().optional().default(''),
});

export type CreateFlagSchema = z.infer<typeof createFlagSchema>;