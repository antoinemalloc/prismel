import type { Request, Response, NextFunction } from "express";
import { createTagSchema, updateTagSchema } from "../schemas/tag.schema.js";

export function validateCreateTag(req: Request, res: Response, next: NextFunction) {
  const result = createTagSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }
  next();
}

export function validateUpdateTag(req: Request, res: Response, next: NextFunction) {
  const result = updateTagSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }
  next();
}
