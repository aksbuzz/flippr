import z from "zod";
import { createFlagVariantBodySchema, updateFlagStateBodySchema } from "./flags.schema";

export type CreateFlagVariant = z.infer<typeof createFlagVariantBodySchema>
export type UpdateFlagState = z.infer<typeof updateFlagStateBodySchema>