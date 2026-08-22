import { useState, useEffect } from "react";
import type { CreateAliasInput } from "@/types/alias";
import { X, RefreshCw } from "lucide-react";
import { api } from "../../../lib/api";
import { ModalPortal } from "../../../components/ModalPortal";

interface QuickGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function QuickGenerateModal({ open, onClose, onCreated }: QuickGenerateModalProps) {
  const [domain, setDomain] = useState<string>("");
  const [serviceName, setServiceName] = useState("");
  const [generated, setGenerated] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setError(null);
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          try {
            const domainList = JSON.parse(data.alias_domains || "[]");
            const list = Array.isArray(domainList) ? domainList : [];
            setDomains(list);
            if (!domain && list.length > 0) {
              setDomain(list[0]);
            }
          } catch {
            setDomains([]);
          }
        })
        .catch(() => setDomains([]));
    }
  }, [open]);

  if (!open) return null;

  const doGenerate = async () => {
    try {
      const result = await api.generateAlias(domain);
      setGenerated(result.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate alias");
    }
  };

  const handleCreate = async () => {
    if (!generated) return;
    setSubmitting(true);
    setError(null);
    try {
      const input: CreateAliasInput = {
        email: generated,
        domain,
        serviceName: serviceName.trim() || undefined,
      };
      await api.createAlias(input);
      setServiceName("");
      setGenerated("");
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create alias");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Quick Generate</h2>
            <p className="mt-0.5 text-sm text-zinc-500">Generate a random alias instantly</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Generated Alias
            </div>
            <div className="mb-1 font-mono text-xl font-medium text-zinc-900 dark:text-zinc-100">
              {generated || "—"}
            </div>
            <div className="text-xs text-zinc-400">Random unique identifier</div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Domain
            </label>
            <select
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setGenerated("");
              }}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Service Name (optional)
            </label>
            <input
              type="text"
              autoCapitalize="sentences"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Shopping, Newsletter..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950/50">
          <button
            onClick={doGenerate}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting || !generated}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {submitting ? "Creating..." : "Create This Alias"}
          </button>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
