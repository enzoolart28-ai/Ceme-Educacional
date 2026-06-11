"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  moveCourseModuleAction,
  moveCourseSubjectAction,
} from "@/app/actions/courses";

export function CourseReorderButtons({
  id,
  courseId,
  kind,
}: {
  id: string;
  courseId: string;
  kind: "module" | "subject";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const fn = kind === "module" ? moveCourseModuleAction : moveCourseSubjectAction;
      await fn({ id, course_id: courseId, direction });
      router.refresh();
    });
  }

  const btn =
    "rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40";

  return (
    <div className="flex flex-col">
      <button onClick={() => move("up")} disabled={isPending} aria-label="Mover para cima" className={btn}>
        <ChevronUp className="h-4 w-4" />
      </button>
      <button onClick={() => move("down")} disabled={isPending} aria-label="Mover para baixo" className={btn}>
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
