import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";

interface RedirectComboboxProps {
  value: string;
  onChange: (value: string) => void;
  targets: string[];
  placeholder?: string;
}

export function RedirectCombobox({ value, onChange, targets, placeholder }: RedirectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!value) return targets;
    const q = value.toLowerCase();
    return targets.filter((t) => t.toLowerCase().includes(q));
  }, [targets, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const select = (target: string) => {
    onChange(target);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && highlighted < filtered.length) {
          select(filtered[highlighted]);
        } else {
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        setHighlighted(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="email"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 pr-10 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {filtered.map((target, i) => (
            <li
              key={target}
              onMouseDown={(e) => {
                e.preventDefault();
                select(target);
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`cursor-pointer px-4 py-2 text-sm font-mono ${
                i === highlighted
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              }`}
            >
              {target}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
