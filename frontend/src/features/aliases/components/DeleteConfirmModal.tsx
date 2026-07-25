import { useState, useEffect } from "react";
import type { Alias } from "@/types/alias";
import { X, Trash2 } from "lucide-react";
import { api } from "../../../lib/api";
import { ModalPortal } from "../../../components/ModalPortal";

interface DeleteConfirmModalProps {
  open: boolean;
  alias: Alias | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteConfirmModal({ open, alias, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  if (!open || !alias) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAlias(alias.id);
      onDeleted();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete alias");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Delete Alias</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{alias.email}</span>?{" "}
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950/50">
          <button
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
