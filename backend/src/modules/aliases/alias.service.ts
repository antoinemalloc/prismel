import { aliasRepository } from "./alias.repository.js";
import type { Alias, CreateAliasInput, UpdateAliasInput, GeneratedAlias, SyncResult } from "../../types/alias.js";
import { generateAlias, isDomainValid } from "./alias.generator.js";
import { settingsService } from "../settings/settings.service.js";
import { getProviderClient } from "../../providers/registry.js";
import { resolveFavicon, randomPastelTint } from "../../lib/favicon.js";
import crypto from "crypto";

export const aliasService = {
  getAll(): Alias[] {
    return aliasRepository.findAll();
  },

  getById(id: string): Alias | undefined {
    return aliasRepository.findById(id);
  },

  async create(input: CreateAliasInput): Promise<Alias> {
    const [, domain] = input.email.split("@");
    const destination = input.destination || input.email;
    const provider = settingsService.getDomainProviders()[domain];

    if (!provider) {
      throw new Error(`No provider configured for domain: ${domain}`);
    }

    const client = getProviderClient(provider);
    if (!client) {
      throw new Error(`Provider "${provider}" is not supported`);
    }

    let providerId: string;
    try {
      providerId = await client.createRedirection(domain, input.email, destination);
    } catch (e) {
      throw new Error(`Provider create redirection failed: ${(e as Error).message}`);
    }

    const now = new Date().toISOString();

    let faviconUrl: string | undefined;
    let faviconTint: string | undefined;
    if (input.url) {
      const resolved = await resolveFavicon(input.url).catch(() => null);
      faviconUrl = resolved?.dataUrl ?? undefined;
      faviconTint = resolved?.tint ?? randomPastelTint();
    }

    const alias: Alias = {
      id: crypto.randomUUID(),
      email: input.email,
      provider,
      providerId,
      domain: input.domain,
      destination,
      serviceName: input.serviceName,
      url: input.url || undefined,
      favicon: faviconUrl,
      tint: faviconTint,
      description: input.description,
      tags: input.tags || [],
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return aliasRepository.create(alias);
  },

  async update(id: string, input: UpdateAliasInput): Promise<Alias | undefined> {
    const existing = aliasRepository.findById(id);
    if (!existing) return undefined;

    const client = getProviderClient(existing.provider);

    // Handle active toggle
    if (input.active !== undefined && input.active !== existing.active) {
      if (input.active) {
        // inactive → active: create remote redirection
        if (!client) throw new Error(`Provider "${existing.provider}" is not supported`);
        const destination = input.destination || existing.destination || existing.email;
        try {
          const providerId = await client.createRedirection(existing.domain, existing.email, destination);
          const data: Record<string, unknown> = {
            active: true,
            providerId,
            destination,
            updatedAt: new Date().toISOString(),
          };
          return aliasRepository.update(id, data as Partial<Alias>);
        } catch (e) {
          throw new Error(`Provider create redirection failed: ${(e as Error).message}`);
        }
      } else {
        // active → inactive: delete remote redirection
        if (client && existing.providerId) {
          try {
            await client.deleteRedirection(existing.domain, existing.providerId);
            await client.verifyDeleted(existing.domain, existing.providerId);
          } catch (e) {
            throw e;
          }
        }
        const data: Record<string, unknown> = {
          active: false,
          providerId: "",
          updatedAt: new Date().toISOString(),
        };
        return aliasRepository.update(id, data as Partial<Alias>);
      }
    }

    if (input.destination && input.destination !== existing.destination && existing.providerId) {
      if (client) {
        try {
          await client.updateRedirection(existing.domain, existing.providerId, input.destination);
        } catch (e) {
          throw new Error(`Provider update redirection failed: ${(e as Error).message}`);
        }
      }
    }

    const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (input.destination !== undefined) data.destination = input.destination || null;
    if (input.serviceName !== undefined) data.serviceName = input.serviceName || null;
    if (input.url !== undefined) {
      data.url = input.url || null;
      if (input.url && input.url !== existing.url) {
        const resolved = await resolveFavicon(input.url).catch(() => null);
        data.favicon = resolved?.dataUrl ?? null;
        data.tint = resolved?.tint ?? randomPastelTint();
      } else if (!input.url) {
        data.favicon = null;
        data.tint = null;
      }
    }
    if (input.description !== undefined) data.description = input.description || null;
    if (input.tags !== undefined) data.tags = input.tags;

    const updated = aliasRepository.update(id, data as Partial<Alias>);

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const alias = aliasRepository.findById(id);
    if (!alias) return false;

    const client = getProviderClient(alias.provider);

    if (alias.active && alias.providerId && client) {
      try {
        await client.deleteRedirection(alias.domain, alias.providerId);
        await client.verifyDeleted(alias.domain, alias.providerId);
      } catch (e) {
        throw e;
      }
    }

    return aliasRepository.delete(id);
  },

  generate(domain: string): GeneratedAlias | null {
    if (!isDomainValid(domain)) return null;
    return generateAlias(domain);
  },

  async sync(onLog?: (line: string) => void): Promise<SyncResult> {
    const result: SyncResult = { new: 0, updated: 0, total: 0, errors: [], logs: [] };
    const logs: string[] = [];
    const log = (line: string) => { logs.push(line); if (onLog) onLog(line); };
    const startTime = Date.now();

    const domains = settingsService.getDomains();
    const domainProviders = settingsService.getDomainProviders();

    log("═══════════════════════════════════════");
    log(`Sync started at ${new Date().toISOString()}`);
    log(`Configured domains: ${domains.join(", ") || "none"}`);
    log("═══════════════════════════════════════");
    log("");

    for (const domain of domains) {
      const domainStart = Date.now();
      const provider = domainProviders[domain];

      log(`┌─ Domain: ${domain}`);
      log(`│  Provider: ${provider || "none"}`);

      if (!provider) {
        log(`│  → No provider configured for this domain — skipped`);
        log(`└─ Skipped`);
        log("");
        continue;
      }

      const syncClient = getProviderClient(provider);
      if (!syncClient) {
        log(`│  → Provider "${provider}" not yet implemented — skipped`);
        log(`└─ Skipped`);
        log("");
        continue;
      }

      try {
        const redirIds = await syncClient.listRedirectionIds(domain);
        const listTime = ((Date.now() - domainStart) / 1000).toFixed(1);
        log(`│  Response: ${redirIds.length} redirection(s) found (took ${listTime}s)`);

        if (redirIds.length === 0) {
          log(`│  → No redirections on this domain`);
          log(`└─ Done (0s)`);
          log("");
          continue;
        }

        let imported = 0;
        let alreadySynced = 0;
        let resurrected = 0;
        let domainErrors = 0;
        const remoteProviderIds = new Set<string>();

        for (let i = 0; i < redirIds.length; i++) {
          const redirId = redirIds[i];
          const progress = `[${i + 1}/${redirIds.length}]`;

          try {
            const redir = await syncClient.getRedirection(domain, String(redirId));
            const providerId = String(redir.id);
            remoteProviderIds.add(providerId);
            const existing = aliasRepository.findByProviderId(providerId);

            if (!existing) {
              const alias = syncClient.mapToAlias(domain, redir);
              aliasRepository.create(alias);
              result.new++;
              imported++;
              log(`│  ${progress} + NEW  #${redirId}  ${redir.from} → ${redir.to}`);
            } else {
              alreadySynced++;
              if (existing.destination !== redir.to) {
                aliasRepository.update(existing.id, {
                  destination: redir.to,
                  email: redir.from,
                  updatedAt: new Date().toISOString(),
                });
                result.updated++;
                log(`│  ${progress} ↻ UPD  #${redirId}  ${redir.from} → ${redir.to} (was: ${existing.destination})`);
              }
              // Resurrect inactive alias that now exists remotely
              if (!existing.active) {
                aliasRepository.update(existing.id, {
                  active: true,
                  updatedAt: new Date().toISOString(),
                });
                resurrected++;
                log(`│  ${progress} ↺ RST  #${redirId}  ${redir.from} — resurrected to active`);
              }
            }
          } catch (e) {
            domainErrors++;
            const msg = `Failed to fetch redirection #${redirId}: ${(e as Error).message}`;
            result.errors.push(msg);
            log(`│  ${progress} ✗ ERR  #${redirId}  ${msg}`);
          }
        }

        // Detect orphans: local active aliases not found on remote
        let orphaned = 0;
        const localAliases = aliasRepository.findByProviderAndDomain(provider, domain);
        for (const local of localAliases) {
          if (local.active && local.providerId && !remoteProviderIds.has(local.providerId)) {
            aliasRepository.update(local.id, {
              active: false,
              updatedAt: new Date().toISOString(),
            });
            orphaned++;
            log(`│  → ORPH  #${local.providerId}  ${local.email} — marked inactive`);
          }
        }

        const domainTime = ((Date.now() - domainStart) / 1000).toFixed(1);
        log(`│`);
        log(`│  Summary: ${imported} new, ${alreadySynced} existing, ${resurrected} resurrected, ${orphaned} orphaned, ${domainErrors} error(s)`);
        log(`└─ Done (${domainTime}s)`);
        log("");
      } catch (e) {
        const msg = `Failed to list redirections: ${(e as Error).message}`;
        result.errors.push(msg);
        log(`│  ✗ ${msg}`);
        log(`└─ Failed`);
        log("");
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log("═══════════════════════════════════════");
    log(`Sync finished in ${elapsed}s`);
    log(`New: ${result.new}  |  Updated: ${result.updated}  |  Errors: ${result.errors.length}  |  Total in DB: ${aliasRepository.findAll().length}`);
    log("═══════════════════════════════════════");

    result.total = aliasRepository.findAll().length;
    result.logs = logs;
    return result;
  },
};
