import type { Alias, CreateAliasInput, UpdateAliasInput, GeneratedAlias, SyncResult } from "@/types/alias";

const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  getAliases: () => request<Alias[]>("/aliases"),

  getAlias: (id: string) => request<Alias>(`/aliases/${id}`),

  createAlias: (input: CreateAliasInput) =>
    request<Alias>("/aliases", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateAlias: (id: string, input: UpdateAliasInput) =>
    request<Alias>(`/aliases/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  deleteAlias: (id: string) =>
    request<void>(`/aliases/${id}`, { method: "DELETE" }),

  generateAlias: (domain: string) =>
    request<GeneratedAlias>("/aliases/generate", {
      method: "POST",
      body: JSON.stringify({ domain }),
    }),

  sync: () =>
    request<SyncResult>("/aliases/sync", { method: "POST" }),

  getSettings: () => request<Record<string, string>>("/settings"),

  getRemoteCount: (provider: string) =>
    request<{ count: number }>(`/providers/${provider}/remote-count`),
};
