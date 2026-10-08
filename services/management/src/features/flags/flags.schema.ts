import { z } from 'zod';
import { tryParseJson } from './flag-values';

export const jsonStringSchema = (field: string) =>
  z
    .string()
    .max(65536, `${field} must be at most 64 KB`)
    .refine(value => tryParseJson(value).ok, {
      message: `${field} must be a valid JSON string (e.g. "true", "123", "\\"hello\\"", "{\\"key\\":\\"value\\"}")`,
    });

const flagVariantKeySchema = z
  .string()
  .trim()
  .min(1, 'Flag variant key is required')
  .max(255, 'Flag variant key must be at most 255 characters');
const flagIdSchema = z.string().uuid();

/** Get flag variants */
export const getFlagVariantsParamsSchema = z.object({ flagId: z.string().uuid() });

/** Create flag variant */
export const createFlagVariantParamsSchema = getFlagVariantsParamsSchema;
export const createFlagVariantBodySchema = z.object({
  key: flagVariantKeySchema,
  value: jsonStringSchema('value'),
  description: z.string().max(255, 'description must be at most 255 characters').optional().default(''),
});

/** Delete flag variant */
export const deleteFlagVariantParamsSchema = z.object({
  flagId: flagIdSchema,
  variantId: z.string().uuid(),
});

/** Update flag state */
export const updateFlagStateParamsSchema = z.object({
  flagId: flagIdSchema,
  environmentId: z.string().uuid(),
});
export const updateFlagStateBodySchema = z.discriminatedUnion('is_enabled', [
  z.object({
    is_enabled: z.literal(true),
    serving_variant_id: z.string().uuid('Must be a valid variant UUID'),
  }),
  z.object({ is_enabled: z.literal(false) }),
]);
