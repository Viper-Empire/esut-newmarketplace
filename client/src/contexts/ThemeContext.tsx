import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemePreference = "light" | "system" | "dark";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const storageKey = "esut-marketplace-theme";
const validPreferences: ThemePreference[] = ["light", "system", "dark"];

function readPreference(fallback: ThemePreference) {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return validPreferences.includes(stored as ThemePreference) ? stored as ThemePreference : fallback;
  } catch {
    return fallback;
  }
}

export function resolveTheme(preference: ThemePreference, systemDarkOverride?: boolean): ResolvedTheme {
  if (preference !== "system") return preference;
  const systemDark = systemDarkOverride ?? (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  return systemDark ? "dark" : "light";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  switchable?: boolean;
}

export function ThemeProvider({ children, defaultTheme = "light", switchable = true }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => switchable ? readPreference(defaultTheme) : defaultTheme);
  const [systemDark, setSystemDark] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const theme: ResolvedTheme = resolveTheme(preference, systemDark);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    if (switchable) {
      try { window.localStorage.setItem(storageKey, preference); } catch { /* Storage may be unavailable; theme still applies for this session. */ }
    }
  }, [preference, theme, switchable]);

  const setPreference = (next: ThemePreference) => setPreferenceState(validPreferences.includes(next) ? next : "system");
  const toggleTheme = () => setPreferenceState(theme === "dark" ? "light" : "dark");
  const value = useMemo(() => ({ preference, theme, setPreference, toggleTheme, switchable }), [preference, theme, switchable]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

export type { ThemePreference, ResolvedTheme };
