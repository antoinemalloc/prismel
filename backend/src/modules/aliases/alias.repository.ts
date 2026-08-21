import { db } from "../../db/index.js";
import { aliases } from "../../db/schema.js";
import { tagRepository } from "../tags/tag.repository.js";
import type { Alias } from "../../types/alias.js";
import type { Tag } from "../../types/tag.js";
import { eq, and } from "drizzle-orm";

type AliasRow = Omit<Alias, "tags">;

function hydrate(rows: AliasRow[]): Alias[] {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const tagsByAlias = tagRepository.getTagsForAliases(ids);
  return rows.map((row) => ({
    ...row,
    tags: tagsByAlias.get(row.id) ?? [],
  }));
}

export const aliasRepository = {
  findAll(): Alias[] {
    const rows = db.select().from(aliases).all() as AliasRow[];
    return hydrate(rows);
  },

  findById(id: string): Alias | undefined {
    const row = db.select().from(aliases).where(eq(aliases.id, id)).get() as AliasRow | undefined;
    if (!row) return undefined;
    return hydrate([row])[0];
  },

  findByEmail(email: string): Alias | undefined {
    const row = db.select().from(aliases).where(eq(aliases.email, email)).get() as AliasRow | undefined;
    if (!row) return undefined;
    return hydrate([row])[0];
  },

  search(query: string): Alias[] {
    const rows = db
      .select()
      .from(aliases)
      .where(eq(aliases.email, query))
      .all() as AliasRow[];
    return hydrate(rows);
  },

  create(alias: Alias): Alias {
    const { tags: aliasTags, ...row } = alias;
    db.insert(aliases).values(row).run();
    if (aliasTags && aliasTags.length > 0) {
      tagRepository.setTagsForAlias(alias.id, aliasTags.map((t) => t.id));
    }
    return this.findById(alias.id)!;
  },

  update(id: string, data: Partial<AliasRow>): Alias | undefined {
    db.update(aliases).set(data).where(eq(aliases.id, id)).run();
    return this.findById(id);
  },

  /** Replace the tag set for one alias. Caller resolves names to Tag rows. */
  setTagsForAlias(aliasId: string, tags: Tag[]): void {
    tagRepository.setTagsForAlias(
      aliasId,
      tags.map((t) => t.id),
    );
  },

  delete(id: string): boolean {
    const result = db.delete(aliases).where(eq(aliases.id, id)).run();
    return result.changes > 0;
  },

  findByProviderId(providerId: string): Alias | undefined {
    const row = db
      .select()
      .from(aliases)
      .where(eq(aliases.providerId, providerId))
      .get() as AliasRow | undefined;
    if (!row) return undefined;
    return hydrate([row])[0];
  },

  findByProviderAndDomain(provider: string, domain: string): Alias[] {
    const rows = db
      .select()
      .from(aliases)
      .where(and(eq(aliases.provider, provider), eq(aliases.domain, domain)))
      .all() as AliasRow[];
    return hydrate(rows);
  },
};
