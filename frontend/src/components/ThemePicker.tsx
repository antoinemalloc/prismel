import { useTheme } from "../lib/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemePicker() {
  const { mode, setMode } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setMode("light")}
        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          mode === "light"
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-800"
        }`}
        aria-pressed={mode === "light"}
      >
        <Sun className="w-4 h-4" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setMode("dark")}
        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          mode === "dark"
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-800"
        }`}
        aria-pressed={mode === "dark"}
      >
        <Moon className="w-4 h-4" />
        Dark
      </button>
    </div>
  );
}
