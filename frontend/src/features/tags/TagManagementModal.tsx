import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { TagWithUsage } from "@/types/tag";
import { ModalPortal } from "@/components/ModalPortal";

interface TagManagementModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after any CRUD operation so callers can refetch dependent data. */
  onChanged?: () => void;
}

export function TagManagementModal({
  open,
  onClose,
  onChanged,
}: TagManagementModalProps) {
  const [tags, setTags] = useState<TagWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TagWithUsage | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const reload = () => {
    setLoading(true);
    api
      .listTags()
      .then(setTags)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load tags"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) reload();
  }, [open]);

  if (!open) return null;

  const handleColorChange = async (tag: TagWithUsage, color: string) => {
    try {
      await api.updateTag(tag.id, { color });
      setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, color } : t)));
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update color");
    }
  };

  const handleNameChange = async (tag: TagWithUsage, name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized || normalized === tag.name) return;
    try {
      await api.updateTag(tag.id, { name: normalized });
      setTags((prev) =>
        prev.map((t) => (t.id === tag.id ? { ...t, name: normalized } : t)),
      );
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename tag");
    }
  };

  const handleDelete = async (tag: TagWithUsage) => {
    if (tag.usageCount > 0) {
      setConfirmDelete(tag);
      return;
    }
    await performDelete(tag);
  };

  const performDelete = async (tag: TagWithUsage) => {
    try {
      await api.deleteTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      setConfirmDelete(null);
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete tag");
    }
  };

  const handleCreate = async () => {
    const name = newName.trim().toLowerCase();
    if (!name) return;
    setCreating(true);
    try {
      const tag = await api.createTag({ name, color: randomPastelHex() });
      setTags((prev) => [...prev, { ...tag, usageCount: 0 }]);
      setNewName("");
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create tag");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Manage tags
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                Rename, recolor, or delete tags. Deleting cascades to all aliases.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                placeholder="New tag name..."
                disabled={creating}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>

          <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
                Loading...
              </div>
            ) : tags.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-zinc-500">
                No tags yet. Create one above.
              </div>
            ) : (
              <ul className="space-y-2">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/30"
                  >
                    <label className="relative cursor-pointer">
                      <span
                        className="block h-7 w-7 rounded-full ring-1 ring-black/10 transition-transform hover:scale-105"
                        style={{ backgroundColor: tag.color }}
                      />
                      <input
                        type="color"
                        value={tag.color}
                        onChange={(e) => handleColorChange(tag, e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`Change color of ${tag.name}`}
                      />
                    </label>
                    <input
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      defaultValue={tag.name}
                      key={`${tag.id}-${tag.name}`}
                      onBlur={(e) => handleNameChange(tag, e.target.value)}
                      className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-900 outline-none transition-colors hover:border-zinc-200 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:text-zinc-100 dark:hover:border-zinc-700"
                    />
                    <span className="text-xs text-zinc-500">
                      {tag.usageCount} {tag.usageCount === 1 ? "alias" : "aliases"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(tag)}
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      aria-label={`Delete ${tag.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                Delete tag "{confirmDelete.name}"?
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Used by {confirmDelete.usageCount}{" "}
                {confirmDelete.usageCount === 1 ? "alias" : "aliases"}. The tag
                will be removed from all of them.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => performDelete(confirmDelete)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalPortal>
  );
}

function randomPastelHex(): string {
  const hue = Math.floor(Math.random() * 360);
  const sat = 70 / 100;
  const light = 80 / 100;
  const h = hue / 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;
  if (sat === 0) {
    r = g = b = light;
  } else {
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) =>
    Math.round(c * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
