import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Alias } from "@/types/alias";
import {
  Mail,
  Search,
  ArrowUpDown,
  Plus,
  Zap,
  Globe,
  CheckCircle2,
  Tag,
  Copy,
  Check,
  AlignJustify,
  LayoutGrid,
} from "lucide-react";
import { api } from "../../../lib/api";
import { QuickGenerateModal } from "./QuickGenerateModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { AliasFormModal } from "./AliasFormModal";

const TAG_COLORS: Record<string, string> = {
  pro: "bg-blue-50 text-blue-700 ring-blue-700/10",
  personal: "bg-violet-50 text-violet-700 ring-violet-700/10",
  perso: "bg-violet-50 text-violet-700 ring-violet-700/10",
  shopping: "bg-amber-50 text-amber-700 ring-amber-700/10",
  newsletter: "bg-rose-50 text-rose-700 ring-rose-700/10",
  social: "bg-violet-50 text-violet-700 ring-violet-700/10",
  public: "bg-sky-50 text-sky-700 ring-sky-700/10",
  contact: "bg-zinc-100 text-zinc-700 ring-zinc-700/10",
  support: "bg-emerald-50 text-emerald-700 ring-emerald-700/10",
};

function getTagClasses(tag: string): string {
  return (
    TAG_COLORS[tag] ||
    "bg-zinc-50 text-zinc-600 ring-zinc-500/10"
  );
}

const INACTIVE_BADGE_CLASSES =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide border bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/40";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function extractHostname(url?: string): string | null {
  if (!url) return null;
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    return new URL(normalized).hostname;
  } catch {
    return null;
  }
}

function RowFavicon({
  favicon,
  active,
}: {
  favicon?: string;
  active: boolean;
}) {
  const [error, setError] = useState(false);
  const iconColor = active
    ? "text-zinc-500 dark:text-zinc-400"
    : "text-zinc-400 dark:text-zinc-500";
  if (!favicon || error) {
    return <Mail className={`h-4 w-4 ${iconColor}`} />;
  }
  return (
    <img
      src={favicon}
      className="h-5 w-5 rounded"
      onError={() => setError(true)}
      alt=""
    />
  );
}

function FaviconCard({
  alias,
  onClick,
  onCopy,
  copied,
}: {
  alias: Alias;
  onClick: () => void;
  onCopy: (e: React.MouseEvent) => void;
  copied: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const iconColor = alias.active
    ? "text-zinc-500 dark:text-zinc-400"
    : "text-zinc-400 dark:text-zinc-500";

  // Use the tint computed server-side and stored in the DB.
  // Format: "rgba(r,g,b,0.06)" for light mode. Dark mode uses 0.08.
  const tintLight = alias.tint ?? undefined;
  const tintDark = alias.tint?.replace("0.06", "0.08");

  return (
    <div
      onClick={onClick}
      style={
        tintLight
          ? ({
              "--card-tint-light": tintLight,
              "--card-tint-dark": tintDark,
            } as React.CSSProperties)
          : undefined
      }
      className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 ${
        tintLight
          ? "bg-[var(--card-tint-light)] dark:bg-[var(--card-tint-dark)]"
          : "bg-white dark:bg-zinc-900"
      }`}
    >
      <button
        onClick={onCopy}
        className="absolute right-3 top-3 rounded p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-zinc-400" />
        )}
      </button>

      <div className="flex items-start gap-3 pr-8">
        {alias.favicon && !imgError ? (
          <img
            src={alias.favicon}
            className="h-10 w-10 flex-shrink-0 rounded-xl"
            onError={() => setImgError(true)}
            alt=""
          />
        ) : (
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 ${iconColor}`}
          >
            <Mail className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-base font-semibold ${
              alias.active
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {alias.serviceName || alias.email}
          </div>
          <div
            className={`truncate text-sm ${
              alias.active
                ? "text-zinc-500"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {alias.email}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="flex flex-wrap gap-1.5">
          {alias.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset ${getTagClasses(
                tag
              )}`}
            >
              {tag}
            </span>
          ))}
          {!alias.active && (
            <span className={INACTIVE_BADGE_CLASSES}>Inactive</span>
          )}
        </div>
        <span
          className={`text-xs ${
            alias.active
              ? "text-zinc-500"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {relativeDate(alias.updatedAt)}
        </span>
      </div>
    </div>
  );
}

export function AliasListPage() {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalMode, setFormModalMode] = useState<"create" | "edit">("create");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [aliasToDelete, setAliasToDelete] = useState<Alias | null>(null);
  const [aliasToEdit, setAliasToEdit] = useState<Alias | null>(null);
  const [formModalVisible, setFormModalVisible] = useState(true);
  const [sortKey, setSortKey] = useState<keyof Alias | null>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const [view, setView] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"row" | "cards">(() => {
    const stored = localStorage.getItem("prismel-view-mode");
    return stored === "cards" ? "cards" : "row";
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 50, aliases.length));
  }, [aliases.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    localStorage.setItem("prismel-view-mode", viewMode);
  }, [viewMode]);

  const fetchAliases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAliases();
      setAliases(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load aliases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAliases();
  }, []);

  useEffect(() => {
    if (!showSortMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSortMenu]);

  const filteredAliases = useMemo(() => {
    let result = aliases;
    if (view === "active") {
      result = result.filter((a) => a.active);
    } else if (view === "inactive") {
      result = result.filter((a) => !a.active);
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return result;
    return result.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        (a.serviceName && a.serviceName.toLowerCase().includes(q)) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [aliases, searchQuery, view]);

  const displayedAliases = useMemo(() => {
    if (!sortKey) return filteredAliases;
    const sorted = [...filteredAliases];
    sorted.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      switch (sortKey) {
        case "email":
          va = a.email.toLowerCase();
          vb = b.email.toLowerCase();
          break;
        case "serviceName":
          va = (a.serviceName || "").toLowerCase();
          vb = (b.serviceName || "").toLowerCase();
          break;
        case "tags":
          va = a.tags.length;
          vb = b.tags.length;
          break;
        case "domain":
          va = a.domain.toLowerCase();
          vb = b.domain.toLowerCase();
          break;
        case "createdAt":
          va = a.createdAt;
          vb = b.createdAt;
          break;
        case "updatedAt":
          va = a.updatedAt;
          vb = b.updatedAt;
          break;
        default:
          return 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredAliases, sortKey, sortDir]);

  const handleSort = (key: keyof Alias) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleCopy = async (
    e: React.MouseEvent,
    email: string,
    id: string
  ) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  function SortArrow({ column }: { column: keyof Alias }) {
    if (sortKey !== column)
      return <span className="ml-1 opacity-40">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const stats = useMemo(() => {
    const domains = new Set(aliases.map((a) => a.domain));
    const tags = new Set(aliases.flatMap((a) => a.tags));
    return {
      total: aliases.length,
      domains: domains.size,
      active: aliases.filter((a) => a.active).length,
      inactive: aliases.filter((a) => !a.active).length,
      tags: tags.size,
    };
  }, [aliases]);

  const openDelete = (alias: Alias) => {
    setAliasToDelete(alias);
    setDeleteModalOpen(true);
  };

  const openEdit = (alias: Alias) => {
    setAliasToEdit(alias);
    setFormModalMode("edit");
    setFormModalOpen(true);
    setFormModalVisible(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          Loading aliases...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 dark:border-red-900/40 dark:bg-red-950/30">
          <p className="mb-1 text-sm font-medium text-red-700 dark:text-red-200">
            Error loading aliases
          </p>
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={fetchAliases}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            Aliases
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage and organize your email aliases across domains
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Zap className="h-4 w-4" />
            Quick Generate
          </button>
          <button
            onClick={() => {
              setFormModalMode("create");
              setAliasToEdit(null);
              setFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            <Plus className="h-4 w-4" />
            Create Alias
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 hidden sm:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-medium text-zinc-900 dark:text-zinc-100">
              {stats.total}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Domains</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-medium text-zinc-900 dark:text-zinc-100">
              {stats.domains}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Active</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-medium text-emerald-700 dark:text-emerald-300">
              {stats.active}
            </div>
            {stats.inactive > 0 && (
            <div className="mb-1 text-xs font-medium text-zinc-400">
              <button
                type="button"
                onClick={() => setView("inactive")}
                className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {stats.inactive} inactive
              </button>
            </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Tags</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <Tag className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-medium text-violet-700 dark:text-violet-300">
              {stats.tags}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setView("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "all"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setView("active")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "active"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setView("inactive")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "inactive"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Inactive
            </button>
          </div>

        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, service, or tags..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 z-10 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 min-w-[160px]">
                {[
                  { key: "email", label: "Alias" },
                  { key: "tags", label: "Tags" },
                  { key: "createdAt", label: "Created" },
                  { key: "updatedAt", label: "Modified" },
                ].map((option) => {
                  const isActive = sortKey === option.key;
                  return (
                    <div
                      key={option.key}
                      onClick={() => {
                        handleSort(option.key as keyof Alias);
                      }}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
                        isActive
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isActive && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setViewMode("row")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "row"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <AlignJustify className="h-3.5 w-3.5" />
              Row
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "cards"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Table or Empty State */}
      {aliases.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Mail className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
          </div>
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No aliases yet
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-zinc-500">
            Create your first email alias to start organizing your online identity.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setFormModalMode("create");
                setAliasToEdit(null);
                setFormModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Create Alias
            </button>
            <button
              onClick={() => setGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Generate One
            </button>
          </div>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {viewMode === "row" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th
                    className="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    <SortArrow column="email" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={() => handleSort("tags")}
                  >
                    Tags
                    <SortArrow column="tags" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={() => handleSort("domain")}
                  >
                    Domain
                    <SortArrow column="domain" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created
                    <SortArrow column="createdAt" />
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={() => handleSort("updatedAt")}
                  >
                    Modified
                    <SortArrow column="updatedAt" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {displayedAliases.slice(0, visibleCount).map((alias) => (
                  <tr
                    key={alias.id}
                    onClick={() => openEdit(alias)}
                    className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${
                      !alias.active ? "text-zinc-400 dark:text-zinc-500" : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 ${
                          alias.active ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500"
                        }`}>
                          <RowFavicon favicon={alias.favicon} active={alias.active} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`flex min-w-0 items-center gap-1 text-sm font-medium ${
                            alias.active
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-400 dark:text-zinc-500"
                          }`}>
                            {(() => {
                              const hostname = extractHostname(alias.url);
                              if (alias.serviceName && hostname) {
                                return (
                                  <>
                                    <span className="truncate">{alias.serviceName}</span>
                                    <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">({hostname})</span>
                                  </>
                                );
                              }
                              if (alias.serviceName) {
                                return <span className="truncate">{alias.serviceName}</span>;
                              }
                              if (hostname) {
                                return <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">{hostname}</span>;
                              }
                              return <span className="truncate">{alias.email}</span>;
                            })()}
                          </div>
                          <div className={`flex items-center gap-1 text-sm ${
                            alias.active ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500"
                          }`}>
                            <span className="truncate">{alias.email}</span>
                            <button
                              onClick={(e) =>
                                handleCopy(e, alias.email, alias.id)
                              }
                              className="rounded p-0.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              title="Copy to clipboard"
                            >
                              {copiedId === alias.id ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className={`h-3 w-3 ${alias.active ? "text-zinc-400" : "text-zinc-400 dark:text-zinc-500"}`} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {alias.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset ${getTagClasses(
                              tag
                            )}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {!alias.active && (
                          <span className={INACTIVE_BADGE_CLASSES}>Inactive</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium dark:bg-zinc-800 ${
                        alias.active
                          ? "text-zinc-700 dark:text-zinc-300"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}>
                        {alias.domain}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs ${alias.active ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500"}`}>
                        {formatDate(alias.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs ${alias.active ? "text-zinc-500" : "text-zinc-400 dark:text-zinc-500"}`}>
                        {formatDate(alias.updatedAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedAliases.slice(0, visibleCount).map((alias) => (
              <FaviconCard
                key={alias.id}
                alias={alias}
                onClick={() => openEdit(alias)}
                onCopy={(e) => handleCopy(e, alias.email, alias.id)}
                copied={copiedId === alias.id}
              />
            ))}
          </div>
        )}
        <div className="border-t border-zinc-100 px-6 py-4 text-center dark:border-zinc-800">
            <span className="text-sm text-zinc-500">
              Showing {Math.min(visibleCount, displayedAliases.length)} of{" "}
              {displayedAliases.length} aliases
              {aliases.length !== displayedAliases.length && (
                <> &middot; {aliases.length} total</>
              )}
            </span>
            <div ref={sentinelRef} className="h-px" />
          </div>
        </div>
      )}

      <AliasFormModal
        open={formModalOpen}
        mode={formModalMode}
        alias={aliasToEdit}
        visible={formModalVisible}
        onClose={() => {
          setFormModalOpen(false);
          setAliasToEdit(null);
        }}
        onSaved={fetchAliases}
        onDelete={
          formModalMode === "edit"
            ? () => {
                if (aliasToEdit) {
                  setFormModalVisible(false);
                  openDelete(aliasToEdit);
                }
              }
            : undefined
        }
      />
      <QuickGenerateModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onCreated={fetchAliases}
      />
      <DeleteConfirmModal
        open={deleteModalOpen}
        alias={aliasToDelete}
        onClose={() => {
          setFormModalVisible(true);
          setDeleteModalOpen(false);
          setAliasToDelete(null);
        }}
        onDeleted={() => {
          fetchAliases();
          setFormModalOpen(false);
          setAliasToEdit(null);
        }}
      />
    </div>
  );
}
