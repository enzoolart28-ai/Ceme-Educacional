"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAttendanceAction } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";

export function AttendanceDeleteButton({
  id,
  classId,
}: {
  id: string;
  classId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir esta chamada e seus registros?")) return;
    startTransition(() => {
      void deleteAttendanceAction({ id, class_id: classId });
    });
  }

  return (
    <Button variant="danger" size="sm" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
