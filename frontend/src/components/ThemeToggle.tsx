import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors duration-150 hover:bg-zinc-200/50 hover:text-zinc-900 md:justify-center lg:justify-between dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="flex items-center gap-3">
        {isDark ? (
          <Moon className="h-5 w-5 flex-shrink-0" />
        ) : (
          <Sun className="h-5 w-5 flex-shrink-0" />
        )}
        <span className="hidden lg:inline">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
      </span>
      <span
        className={`relative hidden h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 lg:inline-flex ${
          isDark ? "bg-zinc-900 dark:bg-zinc-600" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isDark ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
