import { db } from "../../db/index.js";
import { aliases } from "../../db/schema.js";
import type { Alias } from "../../types/alias.js";
import { eq, and } from "drizzle-orm";

export const aliasRepository = {
  findAll(): Alias[] {
    return db.select().from(aliases).all() as Alias[];
  },

  findById(id: string): Alias | undefined {
    return db.select().from(aliases).where(eq(aliases.id, id)).get() as Alias | undefined;
  },

  findByEmail(email: string): Alias | undefined {
    return db.select().from(aliases).where(eq(aliases.email, email)).get() as Alias | undefined;
  },

  search(query: string): Alias[] {
    return db
      .select()
      .from(aliases)
      .where(eq(aliases.email, query))
      .all() as Alias[];
  },

  create(alias: Alias): Alias {
    db.insert(aliases).values(alias).run();
    return alias;
  },

  update(id: string, data: Partial<Alias>): Alias | undefined {
    db.update(aliases).set(data).where(eq(aliases.id, id)).run();
    return this.findById(id);
  },

  delete(id: string): boolean {
    const result = db.delete(aliases).where(eq(aliases.id, id)).run();
    return result.changes > 0;
  },

  findByProviderId(providerId: string): Alias | undefined {
    return db.select().from(aliases).where(eq(aliases.providerId, providerId)).get() as Alias | undefined;
  },

  findByProviderAndDomain(provider: string, domain: string): Alias[] {
    return db
      .select()
      .from(aliases)
      .where(and(eq(aliases.provider, provider), eq(aliases.domain, domain)))
      .all() as Alias[];
  },
};
