"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  markAnnouncementReadAction,
  markMessageReadAction,
} from "@/app/actions/communication";

/** Marca o item como lido ao abrir a página (uma vez). */
export function AutoMarkRead({
  kind,
  id,
}: {
  kind: "announcement" | "message";
  id: string;
}) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void (async () => {
      if (kind === "announcement") await markAnnouncementReadAction({ announcementId: id });
      else await markMessageReadAction({ id });
      router.refresh();
    })();
  }, [kind, id, router]);

  return null;
}
