import { X, ExternalLink } from "lucide-react";
import { ModalPortal } from "../../components/ModalPortal";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <img src="/icon.png" alt="Prismel" className="h-16 w-16 rounded-xl" />
            <div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Prismel</h3>
              <p className="text-sm text-zinc-500">Enriched email alias manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-zinc-500">Version</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">
                Build #{__BUILD_NUMBER__} ({__COMMIT_HASH__})
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-zinc-500">Commit date</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-100">{__COMMIT_DATE__}</span>
            </div>
          </div>

          <a
            href="https://github.com/voidcode29/prismel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 underline-offset-2 transition-colors hover:underline dark:text-zinc-100"
          >
            github.com/voidcode29/prismel
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex justify-end border-t border-zinc-100 bg-zinc-50/50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-950/50">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Close
          </button>
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}
