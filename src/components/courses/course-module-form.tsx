"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { courseModuleSchema, type CourseModuleInput } from "@/lib/courses/schemas";
import { addCourseModuleAction } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export function CourseModuleForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseModuleInput>({
    resolver: zodResolver(courseModuleSchema),
    defaultValues: { course_id: courseId, name: "", description: "", workload_hours: "" },
  });

  function onSubmit(values: CourseModuleInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await addCourseModuleAction(values);
      if (result.error) setServerError(result.error);
      else {
        reset({ course_id: courseId, name: "", description: "", workload_hours: "" });
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Novo módulo
      </Button>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Novo módulo</h3>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register("course_id")} />
          {serverError && <Alert tone="error">{serverError}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="m_name">Nome *</Label>
              <Input id="m_name" hasError={!!errors.name} {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="m_wh">Carga (h)</Label>
              <Input id="m_wh" type="number" {...register("workload_hours")} />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="m_desc">Descrição</Label>
              <Input id="m_desc" {...register("description")} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" isLoading={isPending}>Salvar</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
