import { db } from "../../db/index.js";
import { tags, aliasTags } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";
import type { Tag, TagWithUsage, CreateTagInput, UpdateTagInput } from "../../types/tag.js";

type TagRow = {
  id: number;
  name: string;
  color: string;
  createdAt: string;
};

function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
  };
}

export const tagRepository = {
  listAll(): TagWithUsage[] {
    const rows = db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
        usageCount: sql<number>`COUNT(${aliasTags.aliasId})`.as("usage_count"),
      })
      .from(tags)
      .leftJoin(aliasTags, eq(aliasTags.tagId, tags.id))
      .groupBy(tags.id)
      .all();
    return rows.map((row) => ({
      ...toTag(row),
      usageCount: row.usageCount,
    }));
  },

  findById(id: number): Tag | undefined {
    const row = db.select().from(tags).where(eq(tags.id, id)).get() as TagRow | undefined;
    return row ? toTag(row) : undefined;
  },

  findByName(name: string): Tag | undefined {
    const row = db
      .select()
      .from(tags)
      .where(eq(tags.name, name.toLowerCase()))
      .get() as TagRow | undefined;
    return row ? toTag(row) : undefined;
  },

  create(input: CreateTagInput): Tag {
    const now = new Date().toISOString();
    db.insert(tags)
      .values({
        name: input.name.toLowerCase(),
        color: input.color,
        createdAt: now,
      })
      .run();
    const row = db
      .select()
      .from(tags)
      .where(eq(tags.name, input.name.toLowerCase()))
      .get() as TagRow;
    return toTag(row);
  },

  update(id: number, input: UpdateTagInput): Tag | undefined {
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name.toLowerCase();
    if (input.color !== undefined) updates.color = input.color;
    if (Object.keys(updates).length === 0) return this.findById(id);
    db.update(tags).set(updates).where(eq(tags.id, id)).run();
    return this.findById(id);
  },

  delete(id: number): boolean {
    const result = db.delete(tags).where(eq(tags.id, id)).run();
    return result.changes > 0;
  },

  /** Get tags for one or many aliases, as Tag[] objects. */
  getTagsForAliases(aliasIds: string[]): Map<string, Tag[]> {
    const map = new Map<string, Tag[]>();
    if (aliasIds.length === 0) return map;
    const rows = db
      .select({
        aliasId: aliasTags.aliasId,
        id: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
      })
      .from(aliasTags)
      .innerJoin(tags, eq(tags.id, aliasTags.tagId))
      .where(sql`${aliasTags.aliasId} IN (${sql.join(aliasIds.map((id) => sql`${id}`), sql`, `)})`)
      .all();
    for (const row of rows) {
      const list = map.get(row.aliasId) ?? [];
      list.push(toTag(row));
      map.set(row.aliasId, list);
    }
    return map;
  },

  /** Replace the tag set for one alias. */
  setTagsForAlias(aliasId: string, tagIds: number[]): void {
    db.delete(aliasTags).where(eq(aliasTags.aliasId, aliasId)).run();
    if (tagIds.length === 0) return;
    const values = tagIds.map((tagId) => ({ aliasId, tagId }));
    db.insert(aliasTags).values(values).run();
  },

  /** Count aliases using a given tag. */
  countUsage(tagId: number): number {
    const row = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(aliasTags)
      .where(eq(aliasTags.tagId, tagId))
      .get();
    return row?.count ?? 0;
  },
};
