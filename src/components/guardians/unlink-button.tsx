"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Unlink } from "lucide-react";
import { unlinkStudentAction } from "@/app/actions/guardians";

export function UnlinkButton({ id, guardianId }: { id: string; guardianId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Remover o vínculo deste aluno com o responsável?")) return;
    startTransition(async () => {
      await unlinkStudentAction({ id, guardian_id: guardianId });
      router.refresh();
    });
  }

  return (
    <button
      onClick={remove}
      disabled={isPending}
      aria-label="Remover vínculo"
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Unlink className="h-4 w-4" />
    </button>
  );
}
