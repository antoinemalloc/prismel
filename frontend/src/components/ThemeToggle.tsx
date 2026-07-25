import { Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { mode, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`w-full flex items-center justify-center lg:justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100 ${className}`}
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mode === "dark" ? (
        <Sun className="w-5 h-5 flex-shrink-0" />
      ) : (
        <Moon className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="hidden lg:inline">
        {mode === "dark" ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
