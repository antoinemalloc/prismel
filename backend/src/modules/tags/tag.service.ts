import { tagRepository } from "./tag.repository.js";
import { randomPastel } from "../../lib/color.js";
import type { Tag, TagWithUsage, CreateTagInput, UpdateTagInput } from "../../types/tag.js";

export const tagService = {
  list(): TagWithUsage[] {
    return tagRepository.listAll();
  },

  search(query: string): Tag[] {
    if (!query.trim()) return [];
    return tagRepository.search(query.trim());
  },

  findById(id: number): Tag | undefined {
    return tagRepository.findById(id);
  },

  /**
   * Find a tag by name, or create it with a frozen random pastel color.
   * Used by alias.service at create/update time so unknown tags become
   * first-class Tag rows without an explicit creation step.
   */
  getOrCreateByName(name: string): Tag {
    const normalized = name.toLowerCase().trim();
    const existing = tagRepository.findByName(normalized);
    if (existing) return existing;
    return tagRepository.create({ name: normalized, color: randomPastel() });
  },

  /**
   * Resolve tag inputs to Tag rows. For tags that already exist, the DB color
   * wins. For new tags, the caller-provided color (e.g. the chip preview from
   * the frontend) is used; if absent, a random pastel is generated.
   */
  resolveInputs(inputs: Array<{ name: string; color?: string }>): Tag[] {
    const seen = new Set<string>();
    const result: Tag[] = [];
    for (const input of inputs) {
      const normalized = input.name.toLowerCase().trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      const existing = tagRepository.findByName(normalized);
      if (existing) {
        result.push(existing);
        continue;
      }
      const color = input.color || randomPastel();
      result.push(tagRepository.create({ name: normalized, color }));
    }
    return result;
  },

  /** Convenience wrapper for callers that only have names (no colors). */
  resolveNames(names: string[]): Tag[] {
    return this.resolveInputs(names.map((name) => ({ name })));
  },

  create(input: CreateTagInput): Tag {
    return tagRepository.create(input);
  },

  update(id: number, input: UpdateTagInput): Tag | undefined {
    if (input.name !== undefined) {
      const conflict = tagRepository.findByName(input.name);
      if (conflict && conflict.id !== id) {
        throw new Error(`Tag "${input.name}" already exists`);
      }
    }
    return tagRepository.update(id, input);
  },

  /**
   * Delete a tag. Cascade behavior is handled by the FK ON DELETE CASCADE
   * on alias_tags.tag_id. Aliases that used the tag lose the association
   * silently — the caller (controller / modal) is expected to confirm
   * with the user before calling.
   */
  delete(id: number): boolean {
    return tagRepository.delete(id);
  },

  countUsage(id: number): number {
    return tagRepository.countUsage(id);
  },

  /**
   * If a tag has zero aliases using it, delete it. Returns true if the tag
   * was deleted, false if it's still in use (or doesn't exist).
   * Called from alias.service after operations that may drop the last
   * reference to a tag.
   */
  cleanupIfOrphan(id: number): boolean {
    if (this.countUsage(id) === 0) {
      return this.delete(id);
    }
    return false;
  },

  /** Cleanup multiple tag ids at once. Returns the number deleted. */
  cleanupOrphans(ids: number[]): number {
    let deleted = 0;
    for (const id of ids) {
      if (this.cleanupIfOrphan(id)) deleted++;
    }
    return deleted;
  },
};
