import { OvhClient } from "./ovh/ovh.client.js";
import type { RemoteRedirection } from "./types.js";

export type { RemoteRedirection };

export interface ProviderClient {
  readonly name: string;
  /** Settings keys this provider requires for configuration and connection testing. */
  readonly configFields: readonly string[];
  /** Create a redirection, returns the opaque provider-specific ID. */
  createRedirection(domain: string, from: string, to: string): Promise<string>;
  /** Delete a redirection. */
  deleteRedirection(domain: string, providerId: string): Promise<void>;
  /** Verify a redirection was deleted (throws if it still exists). */
  verifyDeleted(domain: string, providerId: string): Promise<void>;
  /** Update a redirection destination. */
  updateRedirection(domain: string, providerId: string, to: string): Promise<void>;
  /** List all redirection IDs for a domain (opaque). */
  listRedirectionIds(domain: string): Promise<string[]>;
  /** Get a single redirection detail. */
  getRedirection(domain: string, providerId: string): Promise<RemoteRedirection>;
  /** Test the provider connection. `allSettings` is the merged record (saved + overrides). */
  testConnection(allSettings: Record<string, string>): Promise<{ success: true }>;
}

class OvhProviderClient implements ProviderClient {
  readonly name = "OVH";
  readonly configFields = [
    "ovh_endpoint",
    "ovh_application_key",
    "ovh_application_secret",
    "ovh_consumer_key",
  ] as const;
  private client = new OvhClient();

  async createRedirection(domain: string, from: string, to: string): Promise<string> {
    await this.client.request("POST", `/email/domain/${domain}/redirection`, { from, to, localCopy: false });
    const ids = await this.client.request<number[]>(
      "GET",
      `/email/domain/${domain}/redirection?from=${encodeURIComponent(from)}`,
    );
    if (!ids || ids.length === 0) throw new Error("Redirection created but not found in provider listing");
    return String(ids[0]);
  }

  async deleteRedirection(domain: string, providerId: string): Promise<void> {
    await this.client.request("DELETE", `/email/domain/${domain}/redirection/${providerId}`);
  }

  async verifyDeleted(domain: string, providerId: string): Promise<void> {
    try {
      await this.client.request("GET", `/email/domain/${domain}/redirection/${providerId}`);
      throw new Error(`Redirection ${providerId} still exists after delete`);
    } catch (e) {
      if ((e as Error).message.includes("still exists")) throw e;
      // Any other error (including 404) means it's gone
    }
  }

  async updateRedirection(domain: string, providerId: string, to: string): Promise<void> {
    await this.client.request("PUT", `/email/domain/${domain}/redirection/${providerId}`, { to });
  }

  async listRedirectionIds(domain: string): Promise<string[]> {
    const ids = await this.client.request<number[]>("GET", `/email/domain/${domain}/redirection`);
    return ids.map(String);
  }

  async getRedirection(domain: string, providerId: string): Promise<RemoteRedirection> {
    const raw = await this.client.request<{ id: number; from: string; to: string }>(
      "GET",
      `/email/domain/${domain}/redirection/${providerId}`,
    );
    return { id: String(raw.id), from: raw.from, to: raw.to };
  }

  async testConnection(allSettings: Record<string, string>): Promise<{ success: true }> {
    if (allSettings.ovh_endpoint) {
      return OvhClient.testWith({
        endpoint: allSettings.ovh_endpoint,
        applicationKey: allSettings.ovh_application_key || "",
        applicationSecret: allSettings.ovh_application_secret || "",
        consumerKey: allSettings.ovh_consumer_key || "",
      });
    }
    return OvhClient.test();
  }
}

const providers: Record<string, ProviderClient> = {
  OVH: new OvhProviderClient(),
};

export function getProviderClient(name: string): ProviderClient | undefined {
  return providers[name];
}

export function getSupportedProviders(): string[] {
  return Object.keys(providers);
}
