import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import {
  Mail,
  RefreshCw,
  Settings,
  HelpCircle,


  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";
import { AliasListPage } from "./features/aliases/components/AliasListPage";
import { SyncPage } from "./features/aliases/components/SyncPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { SyncProvider } from "./features/aliases/SyncContext";
import { AboutModal } from "./features/about/AboutModal";

function SidebarNavLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive =
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 md:justify-center lg:justify-start ${
        isActive
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
      }`}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="inline">{label}</span>
    </NavLink>
  );
}

export function App() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="flex items-center gap-2.5">
          <img src="/icon.png" alt="Prismel" className="h-7 w-7 rounded-md" />
          <span className="text-lg font-medium tracking-tight">Prismel</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-200 bg-zinc-100 transition-transform duration-200 ease-out md:translate-x-0 md:w-20 lg:w-64 dark:border-zinc-800 dark:bg-zinc-900 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-3 border-b border-zinc-200 px-4 lg:h-16 dark:border-zinc-800">
            <img
              src="/icon.png"
              alt="Prismel"
              className="h-8 w-8 rounded-md"
            />
            <span className="hidden text-lg font-medium tracking-tight lg:block">
              Prismel
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            <SidebarNavLink
              to="/"
              icon={<Mail className="h-5 w-5" />}
              label="Aliases"
              onClick={closeMobile}
            />
            <SidebarNavLink
              to="/sync"
              icon={<RefreshCw className="h-5 w-5" />}
              label="Sync"
              onClick={closeMobile}
            />
          </nav>

          <div className="space-y-1 border-t border-zinc-200 px-3 py-4 dark:border-zinc-800">
            <ThemeToggle />
            <button
              onClick={() => {
                setAboutOpen(true);
                closeMobile();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition-colors duration-150 hover:bg-zinc-200/50 hover:text-zinc-900 md:justify-center lg:justify-start dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
            >
              <HelpCircle className="h-5 w-5 flex-shrink-0" />
              <span className="inline">About</span>
            </button>
            <SidebarNavLink
              to="/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              onClick={closeMobile}
            />


          </div>
        </div>
      </aside>

      <main className="min-h-screen p-4 pt-14 md:pl-20 md:pt-0 lg:pl-64 lg:p-8">
        <div className="mx-auto max-w-7xl animate-fade-in">
          <SyncProvider>
            <Routes>
              <Route path="/" element={<AliasListPage />} />
              <Route path="/aliases" element={<AliasListPage />} />
              <Route path="/sync" element={<SyncPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </SyncProvider>
        </div>
      </main>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
