import { useState } from "react";
import { Eye, EyeOff, Key } from "lucide-react";

interface OvhCredentialFormProps {
  settings: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function OvhCredentialForm({ settings, onChange }: OvhCredentialFormProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [showConsumer, setShowConsumer] = useState(false);

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Endpoint</label>
        <input
          type="text"
          value={settings.ovh_endpoint || ""}
          onChange={(e) => onChange("ovh_endpoint", e.target.value)}
          placeholder="eu.api.ovh.com"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Application Key</label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={settings.ovh_application_key || ""}
            onChange={(e) => onChange("ovh_application_key", e.target.value)}
            placeholder="d57d46..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Application Secret</label>
        <div className="relative">
          <input
            type={showSecret ? "text" : "password"}
            value={settings.ovh_application_secret || ""}
            onChange={(e) => onChange("ovh_application_secret", e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 pr-12 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => setShowSecret((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            tabIndex={-1}
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Consumer Key</label>
        <div className="relative">
          <input
            type={showConsumer ? "text" : "password"}
            value={settings.ovh_consumer_key || ""}
            onChange={(e) => onChange("ovh_consumer_key", e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 pr-12 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => setShowConsumer((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            tabIndex={-1}
          >
            {showConsumer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
