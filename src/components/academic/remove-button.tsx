"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  removeAssignmentAction,
  removeEnrollmentAction,
} from "@/app/actions/academic";

export function RemoveButton({
  id,
  classId,
  kind,
}: {
  id: string;
  classId: string;
  kind: "enrollment" | "assignment";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result =
        kind === "enrollment"
          ? await removeEnrollmentAction({ id, class_id: classId })
          : await removeAssignmentAction({ id, class_id: classId });
      if (!result.error) router.refresh();
    });
  }

  return (
    <button
      onClick={remove}
      disabled={isPending}
      aria-label="Remover"
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
