"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { unlinkSubjectAction, unlinkClassAction } from "@/app/actions/teachers";

export function TeacherUnlinkButton({
  id,
  teacherId,
  kind,
}: {
  id: string;
  teacherId: string;
  kind: "subject" | "class";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result =
        kind === "subject"
          ? await unlinkSubjectAction({ id, teacher_id: teacherId })
          : await unlinkClassAction({ id, teacher_id: teacherId });
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
