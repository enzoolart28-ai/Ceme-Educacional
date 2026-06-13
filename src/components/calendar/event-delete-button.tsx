"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEventAction } from "@/app/actions/calendar";
import { Button } from "@/components/ui/button";

export function EventDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Excluir este evento?")) return;
    startTransition(() => {
      void deleteEventAction({ id });
    });
  }
  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
