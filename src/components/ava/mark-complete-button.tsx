"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { markLessonProgressAction } from "@/app/actions/ava";
import { Button } from "@/components/ui/button";

export function MarkCompleteButton({
  lessonId,
  courseId,
  completed,
}: {
  lessonId: string;
  courseId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await markLessonProgressAction({
        lesson_id: lessonId,
        course_id: courseId,
        completed: !completed,
      });
      router.refresh();
    });
  }

  return (
    <Button variant={completed ? "outline" : "primary"} onClick={toggle} isLoading={isPending}>
      {completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4" />}
      {completed ? "Concluída (reabrir)" : "Marcar como concluída"}
    </Button>
  );
}
