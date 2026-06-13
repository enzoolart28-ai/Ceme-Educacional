"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAnnouncementAction } from "@/app/actions/communication";
import { Button } from "@/components/ui/button";

export function AnnouncementDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Excluir este comunicado?")) return;
    startTransition(() => {
      void deleteAnnouncementAction({ id });
    });
  }
  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
