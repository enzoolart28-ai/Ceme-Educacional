"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCampaignAction } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";

export function CampaignDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Excluir esta campanha, níveis e participantes?")) return;
    startTransition(() => {
      void deleteCampaignAction({ id });
    });
  }
  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
