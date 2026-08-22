import { useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import type { Tag } from "@/types/tag";
import { api } from "@/lib/api";
import { TagChip } from "./TagChip";

interface TagInputProps {
  /** Currently selected tags. */
  value: Tag[];
  /** Called whenever the selection changes. */
  onChange: (tags: Tag[]) => void;
  /** Called when the user clicks the gear icon. */
  onManageTags?: () => void;
  placeholder?: string;
}

/**
 * Tag input with chip display + autocomplete dropdown.
 * - Dropdown opens on focus and during typing.
 * - Filters existing tags live (case-insensitive).
 * - Keyboard: ArrowUp/Down navigate, Enter selects, Escape closes, Tab accepts.
 * - Space OR comma commits the typed text as a new tag.
 * - Selecting a tag or committing text adds it to the chips.
 *
 * Tags typed by the user are kept as local drafts (negative id) until the
 * parent form submits. The backend `tagService.resolveInputs` creates the
 * real rows from names at that point. Hitting Cancel never leaves an orphan
 * tag in the database.
 */
export function TagInput({
  value,
  onChange,
  onManageTags,
  placeholder = "Type a tag...",
}: TagInputProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .listTags()
      .then((rows) =>
        setAllTags(
          rows.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            createdAt: r.createdAt,
          })),
        ),
      )
      .catch(() => setAllTags([]));
  }, []);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedNames = useMemo(
    () => new Set(value.map((t) => t.name.toLowerCase())),
    [value],
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = allTags.filter((t) => !selectedNames.has(t.name.toLowerCase()));
    if (!q) return pool;
    return pool
      .filter((t) => t.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const ai = a.name.toLowerCase().indexOf(q);
        const bi = b.name.toLowerCase().indexOf(q);
        if (ai !== bi) return ai - bi;
        return a.name.localeCompare(b.name);
      });
  }, [allTags, query, selectedNames]);

  const canCreate = query.trim().length > 0 && !selectedNames.has(query.trim().toLowerCase());

  const addTag = (tag: Tag) => {
    if (selectedNames.has(tag.name.toLowerCase())) return;
    onChange([...value, tag]);
    setQuery("");
    setHighlight(0);
    setOpen(false);
  };

  const removeTag = (id: number) => {
    onChange(value.filter((t) => t.id !== id));
  };

  /**
   * Commit the typed text as a local draft tag (not persisted yet).
   * Real persistence happens when the parent form submits — the names are
   * sent to the backend which resolves them via `tagService.resolveInputs`.
   * Draft ids are negative so they can never collide with real tag ids.
   */
  const commitTyped = () => {
    const raw = query.trim();
    if (!raw) return;
    const normalized = raw.toLowerCase();
    if (selectedNames.has(normalized)) {
      setQuery("");
      setHighlight(0);
      setOpen(false);
      return;
    }
    addTag({
      id: -Date.now(),
      name: normalized,
      color: randomPastelHex(),
      createdAt: new Date().toISOString(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight < suggestions.length) {
        addTag(suggestions[highlight]);
      } else {
        commitTyped();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Tab") {
      if (open && suggestions[highlight]) {
        e.preventDefault();
        addTag(suggestions[highlight]);
      }
    } else if (e.key === " " || e.key === ",") {
      if (query.trim()) {
        e.preventDefault();
        commitTyped();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-stretch rounded-lg border border-zinc-200 bg-zinc-50 focus-within:border-zinc-500 focus-within:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-1 flex-wrap items-center gap-1.5 px-3 py-2">
          {value.map((tag) => (
            <TagChip key={tag.id} tag={tag} onRemove={() => removeTag(tag.id)} />
          ))}
          <input
            ref={inputRef}
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => {
              setOpen(true);
              setHighlight(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
        </div>
        {onManageTags && (
          <button
            type="button"
            onClick={onManageTags}
            className="m-1 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Manage tags"
            title="Manage tags"
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {suggestions.map((tag, i) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag)}
              onMouseEnter={() => setHighlight(i)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                highlight === i
                  ? "bg-zinc-100 dark:bg-zinc-800"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <span
                className="inline-block h-3 w-3 rounded-full ring-1 ring-black/5"
                style={{ backgroundColor: tag.color }}
              />
              <span className="text-zinc-900 dark:text-zinc-100">{tag.name}</span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-1.5 text-xs text-zinc-400">
        Type to search, then Enter or comma to add. Click × to remove.
      </p>
    </div>
  );
}

/**
 * Lightweight random pastel generator for client-side draft tags.
 * Mirrors backend/lib/color.ts randomPastel(). HSL with high lightness → hex.
 * The color is only used for the chip preview; the backend assigns the
 * canonical color when the parent form submits.
 */
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