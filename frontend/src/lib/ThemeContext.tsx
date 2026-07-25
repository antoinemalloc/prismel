import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Mode = "light" | "dark";

interface ThemeContextValue {
  mode: Mode;
  toggle: () => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const MODE_STORAGE_KEY = "prismel-theme";

function getStoredMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(getStoredMode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
