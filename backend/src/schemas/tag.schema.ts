import { z } from "zod";

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name cannot be empty")
    .max(50, "Tag name too long")
    .transform((s) => s.toLowerCase().trim())
    .refine((s) => s.length > 0, "Tag name cannot be empty after trimming"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value (e.g. #a3b4c5)"),
});

export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .transform((s) => s.toLowerCase().trim())
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value (e.g. #a3b4c5)")
    .optional(),
}).refine((data) => data.name !== undefined || data.color !== undefined, {
  message: "At least one of name or color must be provided",
});

export type CreateTagRequest = z.infer<typeof createTagSchema>;
export type UpdateTagRequest = z.infer<typeof updateTagSchema>;
