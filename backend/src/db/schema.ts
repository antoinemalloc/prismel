import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const aliases = sqliteTable("aliases", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  provider: text("provider").notNull(),
  providerId: text("provider_id").notNull(),
  domain: text("domain").notNull(),
  destination: text("destination"),
  serviceName: text("service_name"),
  url: text("url"),
  favicon: text("favicon"),
  tint: text("tint"),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  lastSyncAt: text("last_sync_at"),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  createdAt: text("created_at").notNull(),
});

export const aliasTags = sqliteTable(
  "alias_tags",
  {
    aliasId: text("alias_id")
      .notNull()
      .references(() => aliases.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.aliasId, table.tagId] })],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
