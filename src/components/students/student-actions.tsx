"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Archive, RotateCcw, Trash2 } from "lucide-react";
import {
  archiveStudentAction,
  deleteStudentAction,
  restoreStudentAction,
  setStudentStatusAction,
} from "@/app/actions/students";
import { Button } from "@/components/ui/button";
import type { StudentStatus } from "@/types/models";

export function StudentActions({
  studentId,
  status,
  isArchived,
  canManage,
  isAdmin,
}: {
  studentId: string;
  status: StudentStatus;
  isArchived: boolean;
  canManage: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!canManage) return null;

  function inactivate() {
    startTransition(async () => {
      await setStudentStatusAction(studentId, "inactive");
      router.refresh();
    });
  }

  function archive() {
    if (!confirm("Arquivar este aluno? Ele sairá das listagens, mas não será excluído.")) return;
    startTransition(() => {
      void archiveStudentAction(studentId);
    });
  }

  function restore() {
    startTransition(async () => {
      await restoreStudentAction(studentId);
      router.refresh();
    });
  }

  function remove() {
    if (
      !confirm(
        "EXCLUSÃO PERMANENTE: esta ação não pode ser desfeita. Deseja realmente excluir?",
      )
    )
      return;
    startTransition(() => {
      void deleteStudentAction(studentId);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isArchived ? (
        <Button variant="outline" onClick={restore} isLoading={isPending}>
          <RotateCcw className="h-4 w-4" /> Restaurar
        </Button>
      ) : (
        <>
          {status !== "inactive" && (
            <Button variant="outline" onClick={inactivate} isLoading={isPending}>
              <Ban className="h-4 w-4" /> Inativar
            </Button>
          )}
          <Button variant="outline" onClick={archive} isLoading={isPending}>
            <Archive className="h-4 w-4" /> Arquivar
          </Button>
        </>
      )}
      {isAdmin && (
        <Button variant="danger" onClick={remove} isLoading={isPending}>
          <Trash2 className="h-4 w-4" /> Excluir
        </Button>
      )}
    </div>
  );
}
