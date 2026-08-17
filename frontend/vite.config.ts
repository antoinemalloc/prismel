import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { execSync } from "child_process";

function getGitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

function getGitDate(): string {
  try {
    return execSync("git log -1 --format=%cd --date=short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

function shortHash(s: string): string {
  if (!s) return "unknown";
  return s.substring(0, 7);
}

function shortDate(s: string): string {
  if (!s) return "unknown";
  return s.split("T")[0].replaceAll("-", "/");
}

export default defineConfig({
  define: {
    __COMMIT_HASH__: JSON.stringify(shortHash(process.env.VITE_COMMIT_HASH || getGitHash())),
    __COMMIT_DATE__: JSON.stringify(shortDate(process.env.VITE_COMMIT_DATE || getGitDate())),
    __BUILD_NUMBER__: JSON.stringify(process.env.VITE_BUILD_NUMBER || "dev"),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
