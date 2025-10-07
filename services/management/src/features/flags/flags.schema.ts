import z from 'zod';

const flagVariantKeySchema = z.string().min(1, 'Flag variant key is required');
const flagIdSchema = z.string().min(1, 'Flag id is required');

/** Get flag variants */
export const getFlagVariantsParamsSchema = z.object({ flagId: z.string() });

/** Create flag variant */
export const createFlagVariantParamsSchema = getFlagVariantsParamsSchema;
export const createFlagVariantBodySchema = z.object({
  key: flagVariantKeySchema,
  value: z.string().refine(
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
        'value must be a valid JSON string (e.g. "true", "123", "\\"hello\\"", "{\\"key\\":\\"value\\"}")',
    }
  ),
  description: z.string().optional().default(''),
});

/** Delete flag variant */
export const deleteFlagVariantParamsSchema = z.object({
  flagId: flagIdSchema,
  variantId: z.string(),
});

/** Update flag state */
export const updateFlagStateParamsSchema = z.object({
  flagId: flagIdSchema,
  environmentId: z.string(),
})
export const updateFlagStateBodySchema = z.discriminatedUnion('is_enabled', [
  z.object({
    is_enabled: z.literal(true),
    serving_variant_id: z.string().uuid('Must be a valid variant UUID'),
  }),
  z.object({ is_enabled: z.literal(false) }),
]);
