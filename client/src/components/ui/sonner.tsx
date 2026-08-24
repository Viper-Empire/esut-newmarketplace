import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useDarkMode } from "@/contexts/DarkModeContext";

const Toaster = ({ ...props }: ToasterProps) => {
  const { isDark } = useDarkMode();
  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
