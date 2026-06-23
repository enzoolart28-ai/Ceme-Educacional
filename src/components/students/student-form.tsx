"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, type StudentInput } from "@/lib/students/schemas";
import { createStudentAction, updateStudentAction } from "@/app/actions/students";
import { STUDENT_STATUS_OPTIONS } from "@/lib/students/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FieldName = keyof StudentInput;

export function StudentForm({
  mode,
  studentId,
  defaultValues,
  students = [],
}: {
  mode: "create" | "edit";
  studentId?: string;
  defaultValues: StudentInput;
  /** Lista de alunos existentes (para vincular irmão no cadastro). */
  students?: { id: string; name: string }[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [siblingOfId, setSiblingOfId] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues,
  });

  function onSubmit(values: StudentInput) {
    setServerError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createStudentAction(values, siblingOfId || undefined)
          : await updateStudentAction(studentId!, values);
      // Em sucesso a action redireciona; só chegamos aqui em erro.
      if (result?.error) setServerError(result.error);
    });
  }

  function field(name: FieldName, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    return (
      <div>
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} hasError={!!errors[name]} {...props} {...register(name)} />
        {errors[name] && (
          <p className="mt-1 text-xs text-red-600">{errors[name]?.message as string}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("full_name", "Nome completo *")}</div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              inputMode="numeric"
              hasError={!!errors.cpf}
              {...register("cpf")}
            />
            {errors.cpf ? (
              <p className="mt-1 text-xs text-red-600">{errors.cpf.message as string}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Opcional — deixe em branco para irmãos/menores sem CPF.
              </p>
            )}
          </div>
          {field("rg", "RG")}
          {field("birth_date", "Data de nascimento", { type: "date" })}
          {field("phone", "Telefone", { placeholder: "(00) 00000-0000" })}
          <div className="sm:col-span-2">{field("email", "E-mail", { type: "email" })}</div>
        </CardContent>
      </Card>

      {mode === "create" && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Irmão(ã) já cadastrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="siblingOf">Vincular como irmão de</Label>
            <Select
              id="siblingOf"
              value={siblingOfId}
              onChange={(e) => setSiblingOfId(e.target.value)}
            >
              <option value="">— Nenhum —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-400">
              Ao selecionar, os responsáveis do irmão são copiados automaticamente para este aluno.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">{field("address", "Endereço")}</div>
          <div className="sm:col-span-1">{field("city", "Cidade")}</div>
          <div className="sm:col-span-1">{field("state", "UF", { maxLength: 2, placeholder: "MG" })}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filiação e status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("mother_name", "Nome da mãe")}
          {field("father_name", "Nome do pai")}
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select id="status" {...register("status")}>
              {STUDENT_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            id="notes"
            rows={4}
            className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            {...register("notes")}
          />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" isLoading={isPending}>
          {mode === "create" ? "Cadastrar aluno" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
