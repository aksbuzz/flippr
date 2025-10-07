import { z } from 'zod';

export const projectIdSchema = z.object({ projectId: z.string() });

export const createProjectBodySchema = z.object({
  name: z.string().min(1, 'Project name is required'),
});

export const createEnvironmentParamsSchema = projectIdSchema;
export const createEnvironmentBodySchema = z.object({
  name: z.string().min(1, 'Environment name is required'),
});

export const createFlagBodySchema = z.object({
  name: z.string().min(1, 'Flag name is required'),
  key: z.string().min(1, 'Flag key is required'),
  description: z.string().optional().default(''),
  flag_type: z.enum(['boolean', 'string', 'number', 'json']).default('boolean'),
  off_value: z.string().refine(
    value => {
      try {
        JSON.parse(value);
        return true;
      } catch (error) {
        return false;
      }
    },
    {
      message:
        'off_value must be a valid JSON string (e.g. "true", "123", "\\"hello\\"", "{\\"key\\":\\"value\\"}")',
    }
  ),
});

export const getFlagParamSchema = z.object({ projectId: z.string(), flagId: z.string() });
