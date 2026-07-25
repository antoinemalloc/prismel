import crypto from "crypto";
import type { Alias } from "../../types/alias.js";

export interface OvhRedirection {
  id: number;
  from: string;
  to: string;
}

export function mapRedirectionToAlias(domain: string, redir: OvhRedirection): Alias {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    email: redir.from,
    provider: "OVH",
    providerId: String(redir.id),
    domain,
    destination: redir.to,
    tags: [],
    active: true,
    createdAt: now,
    updatedAt: now,
  };
}
