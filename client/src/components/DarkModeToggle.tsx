import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/contexts/DarkModeContext";

export default function DarkModeToggle({ compact = false }: { compact?: boolean }) {
  const { isDark, toggle } = useDarkMode();
  return <button
    type="button"
    className={`dark-mode-toggle ${compact ? "dark-mode-toggle--compact" : ""}`}
    onClick={toggle}
    aria-pressed={isDark}
    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    title={isDark ? "Switch to light mode" : "Switch to dark mode"}
  >
    {isDark ? <Sun size={compact ? 17 : 18} aria-hidden="true"/> : <Moon size={compact ? 17 : 18} aria-hidden="true"/>}
    <span className="dark-mode-toggle__label">{isDark ? "Light" : "Dark"}</span>
  </button>;
}
