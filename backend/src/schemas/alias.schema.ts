import { z } from "zod";

/**
 * Tag input accepts an optional color so the frontend can preserve the
 * preview color shown in the chip. Existing tags (found by name) ignore the
 * provided color and keep their canonical DB color.
 */
const tagInput = z.object({
  name: z
    .string()
    .min(1, "Tag cannot be empty")
    .max(50, "Tag too long")
    .transform((s) => s.toLowerCase().trim())
    .refine((s) => s.length > 0, "Tag cannot be empty after trimming"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value (e.g. #a3b4c5)")
    .optional(),
});

const tagInputs = z
  .array(tagInput)
  .transform((arr) => {
    const seen = new Set<string>();
    return arr.filter((t) => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });
  });

export const createAliasSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  email: z.string().min(1).optional(),
  serviceName: z.string().optional(),
  description: z.string().optional(),
  tags: tagInputs.optional().default([]),
});

export const updateAliasSchema = z.object({
  email: z.string().min(1).optional(),
  serviceName: z.string().optional(),
  description: z.string().optional(),
  tags: tagInputs.optional(),
});

export const generateAliasSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
});

export type CreateAliasRequest = z.infer<typeof createAliasSchema>;
export type UpdateAliasRequest = z.infer<typeof updateAliasSchema>;
export type GenerateAliasRequest = z.infer<typeof generateAliasSchema>;
