"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { moveLessonAction } from "@/app/actions/ava";

export function LessonReorderButtons({ id, courseId }: { id: string; courseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveLessonAction({ id, course_id: courseId, direction });
      router.refresh();
    });
  }

  const btn = "rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40";
  return (
    <div className="flex flex-col">
      <button onClick={() => move("up")} disabled={isPending} aria-label="Subir" className={btn}>
        <ChevronUp className="h-4 w-4" />
      </button>
      <button onClick={() => move("down")} disabled={isPending} aria-label="Descer" className={btn}>
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
