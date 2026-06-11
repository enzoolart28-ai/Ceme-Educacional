"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { navItemsForRole } from "@/config/navigation";
import { roleLabel } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/layout/sign-out-button";
import type { UserRole } from "@/types/models";

interface DashboardShellProps {
  role: UserRole;
  fullName: string;
  email: string;
  children: React.ReactNode;
}

export function DashboardShell({ role, fullName, email, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = navItemsForRole(role);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <GraduationCap className="h-5 w-5" />
      </div>
      <span className="font-semibold text-slate-900">CME Educacional</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {nav}
        <div className="border-t border-slate-100 p-3">
          <p className="truncate px-3 text-xs text-slate-400">{email}</p>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
              <span className="font-semibold text-slate-900">CME Educacional</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{fullName || email}</p>
              <p className="text-xs text-slate-500">{roleLabel(role)}</p>
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
