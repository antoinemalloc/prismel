import { useState, useEffect, useRef } from "react";
import type { Alias } from "@/types/alias";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Database,
  Mail,
  ArrowRight,
  Terminal,
  X,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useSync } from "../SyncContext";
import { ModalPortal } from "../../../components/ModalPortal";

export function SyncPage() {
  const { syncing, logs, result, error, startSync } = useSync();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState(() =>
    localStorage.getItem("prismel-selected-provider") || "",
  );
  const [providers, setProviders] = useState<string[]>([]);
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const [remoteCountLoading, setRemoteCountLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);

  const fetchAliases = async () => {
    try {
      const data = await api.getAliases();
      setAliases(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load aliases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAliases();
  }, []);

  useEffect(() => {
    if (result) {
      fetchAliases();
    }
  }, [result]);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        const raw = data["domain_providers"];
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Record<string, string>;
            const unique = [...new Set(Object.values(parsed))].sort();
            setProviders(unique);
          } catch {
            // ignore invalid JSON
          }
        }
      })
      .catch(() => {
        // ignore fetch error
      });
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem("prismel-selected-provider", selectedProvider);
      setRemoteCountLoading(true);
      api
        .getRemoteCount(selectedProvider)
        .then((data) => setRemoteCount(data.count))
        .catch(() => setRemoteCount(null))
        .finally(() => setRemoteCountLoading(false));
    } else {
      localStorage.removeItem("prismel-selected-provider");
      setRemoteCount(null);
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            Sync
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Synchronize with configured providers
          </p>
        </div>
        <button
          onClick={startSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {syncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-700 dark:bg-zinc-950/30 dark:text-zinc-300">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Local Aliases</div>
            <div className="mt-0.5 text-2xl font-medium text-zinc-900 dark:text-zinc-100">
              {loading
                ? "—"
                : selectedProvider
                  ? aliases.filter((a) => a.provider === selectedProvider).length
                  : aliases.length}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Provider</div>
            <div className="mt-0.5 text-2xl font-medium text-zinc-900 dark:text-zinc-100">
              {selectedProvider || "Select provider"}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-zinc-500">Remote Aliases</div>
            <div className="mt-0.5 text-2xl font-medium text-zinc-900 dark:text-zinc-100">
              {!selectedProvider || remoteCountLoading ? "—" : remoteCount}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          What does sync do?
        </h3>
        <p className="text-sm leading-relaxed text-zinc-500">
          Sync pulls all email aliases from your configured providers and imports them into Prismel.
          New aliases are added, existing ones are updated, and any local discrepancies are resolved.
          This ensures your local database stays in perfect sync with your providers.
        </p>
      </div>

      {/* Error State */}
      {(error || fetchError) && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-300" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-200">Error</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error || fetchError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result Cards */}
      {result && (
        <div className="mb-6 space-y-4">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Sync complete
            </span>
            <span className="text-sm text-zinc-500">{result.total} total aliases</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-zinc-500">New imported</span>
              </div>
              <div className="text-3xl font-medium text-emerald-700 dark:text-emerald-300">
                {result.new}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-zinc-500">Updated</span>
              </div>
              <div className="text-3xl font-medium text-amber-700 dark:text-amber-300">
                {result.updated}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  <Database className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-zinc-500">Total synced</span>
              </div>
              <div className="text-3xl font-medium text-blue-700 dark:text-blue-300">
                {result.total}
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/30">
              <div className="mb-3 flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-300" />
                <p className="text-sm font-medium text-red-700 dark:text-red-200">
                  {result.errors.length} error{result.errors.length > 1 ? "s" : ""} during sync
                </p>
              </div>
              <ul className="mt-2 space-y-2">
                {result.errors.map((err, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg bg-red-100/50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Live Sync Log */}
      {(syncing || logs.length > 0) && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-zinc-500" />
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Sync Log</h3>
            {syncing && (
              <span className="ml-auto text-xs text-zinc-400">Streaming...</span>
            )}
          </div>
          <div
            ref={logsRef}
            className="max-h-80 overflow-y-auto rounded-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-300 dark:bg-zinc-950 dark:text-zinc-400"
          >
            {logs.length === 0 ? (
              <span className="italic text-zinc-500">Waiting for sync to start...</span>
            ) : (
              logs.map((line, i) => (
                <div key={i} className="break-words leading-relaxed">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* Provider Picker Modal */}
      {showPicker && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm"
            onClick={() => setShowPicker(false)}
          >
            <div
              className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Select provider
                </h3>
                <button
                  onClick={() => setShowPicker(false)}
                  className="rounded-lg p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {providers.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedProvider(p);
                      setShowPicker(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedProvider === p
                        ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {providers.length === 0 && (
                  <p className="py-3 text-center text-sm text-zinc-400">
                    No providers configured
                  </p>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
