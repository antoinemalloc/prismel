import { useState, useEffect } from "react";
import type { Alias, CreateAliasInput, UpdateAliasInput } from "@/types/alias";
import type { Tag } from "@/types/tag";
import { X, RefreshCw, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { api } from "../../../lib/api";
import { RedirectCombobox } from "./RedirectCombobox";
import { ModalPortal } from "../../../components/ModalPortal";
import { TagInput } from "./TagInput";

interface AliasFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  alias?: Alias | null;
  visible?: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}

export function AliasFormModal({
  open,
  mode,
  alias,
  visible = true,
  onClose,
  onSaved,
  onDelete,
}: AliasFormModalProps) {
  const [prefix, setPrefix] = useState("");
  const [domain, setDomain] = useState<string>("");
  const [destination, setDestination] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTargets, setRedirectTargets] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(alias?.active ?? true);
  const [activeSubmitting, setActiveSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && alias) {
      setServiceName(alias.serviceName || "");
      setUrl(alias.url || "");
      setDestination(alias.destination || "");
      setDescription(alias.description || "");
      setSelectedTags(alias.tags);
      setIsActive(alias.active);
    }
  }, [mode, alias]);

  useEffect(() => {
    if (open) {
      setError(null);
      setUrlError(false);
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          try {
            const targets = JSON.parse(data.redirect_targets || "[]");
            const list = Array.isArray(targets) ? targets : [];
            setRedirectTargets(list);
            if (mode === "create" && list.length > 0 && !destination) {
              setDestination(list[0]);
            }
          } catch {
            setRedirectTargets([]);
          }
          try {
            const domainList = JSON.parse(data.alias_domains || "[]");
            setDomains(Array.isArray(domainList) ? domainList : []);
            if (mode === "create" && !domain) {
              setDomain(domainList[0] || "");
            }
          } catch {
            setDomains([]);
          }
        })
        .catch(() => {
          setRedirectTargets([]);
          setDomains([]);
        });
    }
  }, [open, mode]);

  // Auto-generate alias prefix when opening create modal with a domain set
  useEffect(() => {
    if (open && mode === "create" && domain && !prefix) {
      handleGenerate();
    }
  }, [open, mode, domain]);

  if (!open) return null;

  const isEdit = mode === "edit";

  const handleGenerate = async () => {
    try {
      const result = await api.generateAlias(domain);
      setPrefix(result.prefix);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate alias");
    }
  };

  const handleToggleActive = async () => {
    if (!alias) return;
    const newActive = !isActive;
    setIsActive(newActive);
    setError(null);
    setActiveSubmitting(true);
    try {
      await api.updateAlias(alias.id, { active: newActive });
    } catch (e) {
      setIsActive(!newActive); // revert on error
      setError(e instanceof Error ? e.message : "Failed to update alias");
    } finally {
      setActiveSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !prefix.trim()) return;
    if (!isValidUrl(url)) {
      setUrlError(true);
      return;
    }
    const tagInputs = selectedTags.map((t) => ({
      name: t.name.toLowerCase(),
      // Only send color for local drafts (negative id). Persisted tags keep
      // their canonical DB color; the backend ignores any provided color
      // when the tag already exists.
      color: t.id < 0 ? t.color : undefined,
    }));
    if (tagInputs.some((t) => t.name === "inactive")) {
      setError('"Inactive" is a reserved tag and cannot be used');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isEdit && alias) {
        const input: UpdateAliasInput = {
          destination: destination.trim(),
          serviceName: serviceName.trim(),
          url: url.trim(),
          description: description.trim(),
          tags: tagInputs,
        };
        await api.updateAlias(alias.id, input);
      } else {
        const input: CreateAliasInput = {
          email: `${prefix.trim()}@${domain}`,
          domain,
          destination: destination.trim() || undefined,
          serviceName: serviceName.trim() || undefined,
          url: url.trim() || undefined,
          description: description.trim() || undefined,
          tags: tagInputs,
        };
        await api.createAlias(input);
        setPrefix("");
        setDestination("");
        setServiceName("");
        setUrl("");
        setDescription("");
        setSelectedTags([]);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${isEdit ? "update" : "create"} alias`);
    } finally {
      setSubmitting(false);
    }
  };

  const title = isEdit ? "Edit Alias" : "Create New Alias";
  const subtitle = isEdit ? "Update alias metadata" : "Add a new email alias to your account";
  const submitLabel = isEdit
    ? submitting
      ? "Saving..."
      : "Save Changes"
    : submitting
    ? "Creating..."
    : "Create Alias";

  return (
    <ModalPortal>
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm ${
        visible ? "" : "hidden"
      }`}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{title}</h2>
            <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6" autoComplete="off">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            {isEdit ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-sm font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                {alias!.email}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 shadow-sm">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      placeholder="alias-name"
                      className="w-full rounded-l-lg border border-r-0 border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-9 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleGenerate}
                      title="Generate"
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="min-w-[140px] rounded-r-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {domains.map((d) => (
                      <option key={d} value={d}>@{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Redirect To */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Redirect To
            </label>
            <RedirectCombobox
              value={destination}
              onChange={setDestination}
              targets={redirectTargets}
              placeholder={isEdit ? "your-real@email.com" : "your-real@email.com (defaults to alias itself)"}
            />
          </div>

          {/* Service Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Service Name
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Newsletter"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Website URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError(false);
              }}
              onBlur={() => setUrlError(!isValidUrl(url))}
              placeholder="example.com"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {urlError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                Invalid URL
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this alias for?"
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tags
            </label>
            <TagInput
              value={selectedTags}
              onChange={setSelectedTags}
            />
          </div>

          {/* Active Toggle */}
          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div>
                <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Active
                </label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  When active, this alias has a remote redirection and works
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={activeSubmitting}
                className="rounded-lg p-2 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800"
                aria-pressed={isActive}
                title={isActive ? "Deactivate alias" : "Activate alias"}
              >
                {activeSubmitting ? (
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                ) : isActive ? (
                  <ToggleRight className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
                )}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="-mx-6 -mb-6 mt-6 flex justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950/50">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (!isEdit && !prefix.trim())}
                className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
      </div>
    </ModalPortal>
  );
}

function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.includes(" ")) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    try {
      new URL(`https://${trimmed}`);
      return true;
    } catch {
      return false;
    }
  }
}
