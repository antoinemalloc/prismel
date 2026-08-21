import { settingsRepository } from "./settings.repository.js";

export const settingsService = {
  getAll() {
    return settingsRepository.getAll();
  },

  get(key: string): string | undefined {
    return settingsRepository.get(key);
  },

  update(data: Record<string, string>) {
    settingsRepository.setMany(data);
    return settingsRepository.getAll();
  },

  getRedirectTargets(): string[] {
    const raw = settingsRepository.get("redirect_targets");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  getDomains(): string[] {
    const raw = settingsRepository.get("alias_domains");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  getDomainProviders(): Record<string, string> {
    const raw = settingsRepository.get("domain_providers");
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  },
};
