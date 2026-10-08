import { z } from 'zod';
import { checkValueMatchesType } from '../flags/flag-values';
import { jsonStringSchema } from '../flags/flags.schema';

export const projectIdSchema = z.object({ projectId: z.string().uuid() });

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Project name must be at most 100 characters'),
});

export const createEnvironmentParamsSchema = projectIdSchema;
// The name is embedded in the environment's SDK key, so it is restricted to safe characters.
export const createEnvironmentBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Environment name is required')
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,49}$/,
      'Environment name must be 1-50 characters: letters, digits, spaces, ".", "_" or "-", starting with a letter or digit'
    ),
});

// The key is embedded in a Redis key and used in URLs, so it is restricted to safe characters.
export const flagKeySchema = z
  .string()
  .min(1, 'Flag key is required')
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/,
    'Flag key must be 1-100 characters: letters, digits, ".", "_" or "-", starting with a letter or digit'
  );

export const createFlagBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Flag name is required').max(100, 'Flag name must be at most 100 characters'),
    key: flagKeySchema,
    description: z.string().max(255, 'description must be at most 255 characters').optional().default(''),
    flag_type: z.enum(['boolean', 'string', 'number', 'json']).default('boolean'),
    off_value: jsonStringSchema('off_value'),
  })
  .superRefine((data, ctx) => {
    const error = checkValueMatchesType(data.flag_type, data.off_value);
    if (error) ctx.addIssue({ code: 'custom', path: ['off_value'], message: `off_value: ${error}` });
  });

export const getFlagParamSchema = z.object({ projectId: z.string().uuid(), flagId: z.string().uuid() });

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
