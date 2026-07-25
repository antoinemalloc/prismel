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
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
}

export interface CreateAliasInput {
  email: string;
  domain: string;
  destination?: string;
  serviceName?: string;
  url?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateAliasInput {
  email?: string;
  destination?: string;
  serviceName?: string;
  url?: string;
  description?: string;
  tags?: string[];
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