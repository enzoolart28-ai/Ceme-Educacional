"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  unlinkCourseSubjectAction,
  deleteCourseModuleAction,
} from "@/app/actions/courses";

export function CourseRemoveButton({
  id,
  courseId,
  kind,
}: {
  id: string;
  courseId: string;
  kind: "subject" | "module";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result =
        kind === "subject"
          ? await unlinkCourseSubjectAction({ id, course_id: courseId })
          : await deleteCourseModuleAction({ id, course_id: courseId });
      if (!result.error) router.refresh();
    });
  }

  return (
    <button
      onClick={remove}
      disabled={isPending}
      aria-label="Remover"
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
