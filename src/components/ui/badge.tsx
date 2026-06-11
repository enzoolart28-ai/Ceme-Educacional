import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ROLE_BADGE_CLASSES,
  roleLabel,
  STATUS_BADGE_CLASSES,
  statusLabel,
} from "@/lib/auth/roles";
import type { UserRole, UserStatus } from "@/types/models";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      {...props}
    />
  );
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge className={ROLE_BADGE_CLASSES[role]}>{roleLabel(role)}</Badge>;
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge className={STATUS_BADGE_CLASSES[status]}>{statusLabel(status)}</Badge>
  );
}
