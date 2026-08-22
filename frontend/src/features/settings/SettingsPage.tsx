import { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Loader2,
  Mail,
  Globe,
  Palette,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";
import { getProviderForm } from "../../providers/registry";
import { ThemePicker } from "../../components/ThemePicker";
import { TagManagementModal } from "../tags/TagManagementModal";

interface SettingsData {
  [key: string]: string;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [redirectTargets, setRedirectTargets] = useState("");
  const [domainPairs, setDomainPairs] = useState<{ domain: string; provider: string }[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [providerList, setProviderList] = useState<string[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/settings/providers").then((r) => r.json()),
    ])
      .then(([data, providers]: [SettingsData, string[]]) => {
        setSettings(data);
        setProviderList(providers);
        try {
          const targets = JSON.parse(data.redirect_targets || "[]");
          setRedirectTargets(Array.isArray(targets) ? targets.join("\n") : "");
        } catch {
          setRedirectTargets("");
        }
        try {
          const domains = JSON.parse(data.alias_domains || "[]");
          const domainProviders = JSON.parse(data.domain_providers || "{}");
          if (Array.isArray(domains)) {
            setDomainPairs(domains.map((d: string) => ({ domain: d, provider: domainProviders[d] || "" })));
          }
        } catch {
          setDomainPairs([]);
        }
      })
      .catch((e) => {
        setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to load settings" });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: string, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const targets = redirectTargets
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean);
      const domains = domainPairs.map((p) => p.domain.trim()).filter(Boolean);
      const providersObj: Record<string, string> = {};
      for (const p of domainPairs) {
        if (p.domain.trim() && p.provider.trim()) {
          providersObj[p.domain.trim()] = p.provider.trim();
        }
      }
      const payload = {
        ...settings,
        redirect_targets: JSON.stringify(targets),
        alias_domains: JSON.stringify(domains),
        domain_providers: JSON.stringify(providersObj),
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || "Save failed");
      }
      setMessage({ type: "success", text: "Settings saved" });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          overrides: settings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ type: "success", text: "Connection successful" });
      } else {
        setTestResult({ type: "error", text: data.error || "Connection failed" });
      }
    } catch {
      setTestResult({ type: "error", text: "Connection test failed" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  const SelectedForm = selectedProvider ? getProviderForm(selectedProvider) : null;

  return (
    <div className="animate-fade-in max-w-5xl">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            Settings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage domains, providers and redirect targets
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl p-4 ${
            message.type === "success"
              ? "border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30"
              : "border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-300" />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === "success"
                ? "text-emerald-700 dark:text-emerald-200"
                : "text-red-700 dark:text-red-200"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Domains */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Domains</h2>
                <p className="text-xs text-zinc-500">Map each domain to its email provider</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {domainPairs.map((pair, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={pair.domain}
                    onChange={(e) => {
                      const next = [...domainPairs];
                      next[i] = { ...next[i], domain: e.target.value };
                      setDomainPairs(next);
                    }}
                    placeholder="domain.com"
                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <select
                    value={pair.provider}
                    onChange={(e) => {
                      const next = [...domainPairs];
                      next[i] = { ...next[i], provider: e.target.value };
                      setDomainPairs(next);
                    }}
                    className="w-32 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="">—</option>
                    {providerList.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDomainPairs(domainPairs.filter((_, j) => j !== i))}
                    className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-zinc-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDomainPairs([...domainPairs, { domain: "", provider: "" }])}
              className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/30"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Domain
            </button>
          </div>

          {/* Providers */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Providers</h2>
                <p className="text-xs text-zinc-500">Configure API credentials per provider</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => { setSelectedProvider(e.target.value); setTestResult(null); }}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                <option value="">Select a provider</option>
                {providerList.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {SelectedForm && <SelectedForm settings={settings} onChange={handleChange} />}

            {selectedProvider && SelectedForm && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Test Connection
                </button>
              </div>
            )}

            {testResult && (
              <div className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${
                testResult.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
              }`}>
                {testResult.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                )}
                <span>{testResult.text}</span>
              </div>
            )}

            {selectedProvider && !SelectedForm && (
              <div className="mt-4">
                <p className="text-sm italic text-zinc-400">{selectedProvider} credentials — coming soon</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {saving ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </span>
            )}
          </button>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* UI */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">UI</h2>
                <p className="text-xs text-zinc-500">Appearance and theme</p>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Theme</h3>
              <ThemePicker />
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Tags</h2>
                <p className="text-xs text-zinc-500">Rename, recolor, or delete tags globally</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Open the tag manager to review usage, change colors, or remove unused tags.
              </p>
              <button
                type="button"
                onClick={() => setTagModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Manage tags
              </button>
            </div>
          </div>

          {/* Redirect Targets */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Redirect Targets</h2>
                <p className="text-xs text-zinc-500">Suggested destinations when creating aliases</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-3 text-xs text-zinc-500">
                One email address per line. These appear as suggestions in the redirect field.
              </p>
              <textarea
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={redirectTargets}
                onChange={(e) => setRedirectTargets(e.target.value)}
                placeholder={"user@example.com\nother@domain.com"}
                rows={10}
                className="w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-mono text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      </div>
      <TagManagementModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
      />
    </div>
  );
}
