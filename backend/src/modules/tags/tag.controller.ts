import type { Request, Response } from "express";
import { tagService } from "./tag.service.js";

export const tagController = {
  list(_req: Request, res: Response) {
    const tags = tagService.list();
    res.json(tags);
  },

  create(req: Request, res: Response) {
    try {
      const tag = tagService.create(req.body);
      res.status(201).json(tag);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  update(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid tag id" });
      return;
    }
    try {
      const tag = tagService.update(id, req.body);
      if (!tag) {
        res.status(404).json({ error: "Tag not found" });
        return;
      }
      res.json(tag);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  delete(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid tag id" });
      return;
    }
    const deleted = tagService.delete(id);
    if (!deleted) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }
    res.status(204).send();
  },
};
