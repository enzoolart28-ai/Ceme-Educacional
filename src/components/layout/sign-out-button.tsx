"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOutAction())}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600",
        "transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      <span>{isPending ? "Saindo..." : "Sair"}</span>
    </button>
  );
}
