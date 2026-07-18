"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-gray-100/50 dark:bg-slate-850/50" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-all active:scale-95 flex items-center justify-center shadow-sm relative overflow-hidden h-9 w-9"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun className={`absolute h-5 w-5 transition-all duration-300 transform ${
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`} />
        <Moon className={`absolute h-5 w-5 transition-all duration-300 transform ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`} />
      </div>
    </button>
  );
}
