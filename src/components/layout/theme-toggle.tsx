"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "dark", label: "Escuro", icon: Moon },
];

export function ThemeToggle() {
  // Lê a preferência salva já na inicialização (o script no layout já aplicou a
  // classe .dark antes da pintura; aqui é só refletir no controle).
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as Theme | null) ?? "light";
  });

  // Mantém sincronizado com o sistema quando a opção for "Sistema".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function choose(next: Theme) {
    localStorage.setItem("theme", next);
    setThemeState(next);
    applyTheme(next);
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5"
      role="group"
      aria-label="Tema"
    >
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => choose(o.value)}
            title={o.label}
            aria-label={o.label}
            aria-pressed={active}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
