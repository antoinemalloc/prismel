import type { Request, Response } from "express";
import { settingsService } from "./settings.service.js";
import { getProviderClient, getSupportedProviders } from "../../providers/registry.js";

export const settingsController = {
  getAll(_req: Request, res: Response) {
    const data = settingsService.getAll();
    res.json(data);
  },

  update(req: Request, res: Response) {
    const data = settingsService.update(req.body);
    res.json(data);
  },

  testConnection: async (req: Request, res: Response) => {
    try {
      const { provider, overrides } = req.body ?? {};
      const merged: Record<string, string> = { ...settingsService.getAll(), ...(overrides ?? {}) };

      let clients: ReturnType<typeof getProviderClient>[];
      if (provider) {
        const client = getProviderClient(provider);
        if (!client) {
          return res.status(404).json({ success: false, error: `Unknown provider: ${provider}` });
        }
        clients = [client];
      } else {
        // No provider specified: pick the first supported provider whose configFields are populated.
        const supported = getSupportedProviders()
          .map((n) => getProviderClient(n))
          .filter((c): c is NonNullable<typeof c> => !!c);
        const populated = supported.filter((c) => c.configFields.some((f) => merged[f]));
        clients = populated.length > 0 ? populated : supported.slice(0, 1);
        if (clients.length === 0) {
          return res.status(400).json({ success: false, error: "No providers available" });
        }
      }

      let lastError: Error | undefined;
      for (const client of clients) {
        if (!client) continue;
        try {
          await client.testConnection(merged);
          return res.json({ success: true });
        } catch (e) {
          lastError = e as Error;
        }
      }
      res.status(400).json({ success: false, error: lastError?.message ?? "Connection test failed" });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  },
};
