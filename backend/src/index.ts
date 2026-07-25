import express from "express";
import cors from "cors";
import { config } from "./lib/config.js";
import { aliasController } from "./modules/aliases/alias.controller.js";
import {
  validateCreateAlias,
  validateUpdateAlias,
  validateGenerateAlias,
} from "./validators/alias.validator.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { settingsController } from "./modules/settings/settings.controller.js";
import { getProviderClient, getSupportedProviders } from "./providers/registry.js";
import { settingsService } from "./modules/settings/settings.service.js";
import { closeDb } from "./db/index.js";

const app = express();

// Health check (must not depend on any module)
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use(cors());
app.use(express.json());

// Alias routes
app.get("/api/aliases", aliasController.getAll);
app.get("/api/aliases/:id", aliasController.getById);
app.post("/api/aliases", validateCreateAlias, aliasController.create);
app.put("/api/aliases/:id", validateUpdateAlias, aliasController.update);
app.delete("/api/aliases/:id", aliasController.delete);
app.post("/api/aliases/generate", validateGenerateAlias, aliasController.generate);
app.post("/api/aliases/sync", aliasController.sync);

// Settings routes
app.get("/api/settings", settingsController.getAll);
app.put("/api/settings", settingsController.update);
app.post("/api/settings/test-connection", settingsController.testConnection);

// Provider routes
app.get("/api/settings/providers", (_req, res) => {
  res.json(getSupportedProviders());
});

app.get("/api/providers/:name/remote-count", async (req, res) => {
  const providerName = req.params.name;
  const client = getProviderClient(providerName);
  if (!client) {
    res.status(404).json({ error: `Provider not found: ${providerName}` });
    return;
  }

  const domains = settingsService.getDomains();
  const domainProviders = settingsService.getDomainProviders();
  let total = 0;

  for (const domain of domains) {
    if (domainProviders[domain] === providerName) {
      try {
        const ids = await client.listRedirectionIds(domain);
        total += Array.isArray(ids) ? ids.length : 0;
      } catch {
        // skip domains that fail
      }
    }
  }

  res.json({ count: total });
});

// Error handler
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed");
    closeDb();
    console.log("Database closed");
    process.exit(0);
  });
  // Force exit after 10s if server.close() hangs
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
