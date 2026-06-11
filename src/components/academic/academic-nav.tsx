"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AcademicNav({ canCatalog }: { canCatalog: boolean }) {
  const pathname = usePathname();

  const items = [
    { label: "Visão geral", href: "/dashboard/academico", exact: true },
    { label: "Turmas", href: "/dashboard/academico/turmas", exact: false },
    ...(canCatalog
      ? [
          { label: "Cursos", href: "/dashboard/academico/cursos", exact: false },
          { label: "Disciplinas", href: "/dashboard/academico/disciplinas", exact: false },
        ]
      : []),
  ];

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
      {items.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
