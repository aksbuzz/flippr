import { z } from 'zod';

export const toggleFlagSchema = z.object({
  is_enabled: z.boolean(),
});

export type ToggleFlagSchema = z.infer<typeof toggleFlagSchema>;