"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { unlinkClassStudentAction } from "@/app/actions/classes";

export function ClassRosterRemoveButton({
  id,
  classId,
}: {
  id: string;
  classId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Remover este aluno da turma?")) return;
    startTransition(async () => {
      await unlinkClassStudentAction({ id, class_id: classId });
      router.refresh();
    });
  }

  return (
    <button
      onClick={remove}
      disabled={isPending}
      aria-label="Remover aluno"
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <UserMinus className="h-4 w-4" />
    </button>
  );
}
