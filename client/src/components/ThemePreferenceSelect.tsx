import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";

const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

export default function ThemePreferenceSelect({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  const selected = options.find(option => option.value === preference) ?? options[1];
  return <label className={`inline-flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
    <selected.Icon size={compact ? 15 : 17} aria-hidden="true" />
    <span className="sr-only">Theme preference</span>
    <select aria-label="Theme preference" value={preference} onChange={event => setPreference(event.target.value as ThemePreference)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-bold text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {!compact && <span className="sr-only">Current theme: {selected.label}</span>}
  </label>;
}
