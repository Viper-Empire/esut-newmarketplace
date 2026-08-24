import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const storageKey = "esut-marketplace-theme";
type DarkModeContextValue = { isDark: boolean; toggle: () => void };
const DarkModeContext = createContext<DarkModeContextValue | null>(null);

function applyTheme(isDark: boolean) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.dataset.theme = isDark ? "dark" : "light";
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(storageKey); } catch { /* Storage can be unavailable. */ }
    const next = stored === "dark";
    setIsDark(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    applyTheme(isDark);
    try { window.localStorage.setItem(storageKey, isDark ? "dark" : "light"); } catch { /* Preference persistence is best effort. */ }
  }, [isDark]);

  const value = useMemo(() => ({ isDark, toggle: () => setIsDark(current => !current) }), [isDark]);
  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode() {
  const value = useContext(DarkModeContext);
  if (!value) throw new Error("useDarkMode must be used inside DarkModeProvider");
  return value;
}

export { storageKey as darkModeStorageKey };
