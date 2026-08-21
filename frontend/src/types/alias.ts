import type { Tag } from "./tag";

export interface Alias {
  id: string;
  email: string;
  provider: string;
  providerId: string;
  domain: string;
  destination?: string;
  serviceName?: string;
  url?: string;
  favicon?: string;
  tint?: string;
  description?: string;
  tags: Tag[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

export interface AliasTagInput {
  name: string;
  /** Optional hex color (e.g. #a3b4c5). Sent for local drafts so the
   *  chip preview matches the color stored on save. Ignored for tags
   *  that already exist in the database (their canonical color wins). */
  color?: string;
}

export interface CreateAliasInput {
  email: string;
  domain: string;
  destination?: string;
  serviceName?: string;
  url?: string;
  description?: string;
  tags?: AliasTagInput[];
}

export interface UpdateAliasInput {
  email?: string;
  destination?: string;
  serviceName?: string;
  url?: string;
  description?: string;
  tags?: AliasTagInput[];
  active?: boolean;
}

export interface GeneratedAlias {
  prefix: string;
  domain: string;
  email: string;
}

export interface SyncResult {
  new: number;
  updated: number;
  total: number;
  errors: string[];
  logs: string[];
}
