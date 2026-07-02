"use client";

import { useState, useTransition } from "react";
import { UserPlus, CheckCircle2 } from "lucide-react";
import { createQuickLeadAction } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export function QuickLeadForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const result = await createQuickLeadAction({
        full_name: fullName,
        phone,
        course_interest: course,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setDone(true);
        setFullName("");
        setPhone("");
        setCourse("");
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {done && (
          <Alert tone="success">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Lead cadastrado com sucesso! O time comercial vai dar sequência.
            </span>
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}

        <div>
          <Label htmlFor="lead_name">Nome completo *</Label>
          <Input
            id="lead_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome do interessado"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="lead_phone">Número (WhatsApp/telefone) *</Label>
            <Input
              id="lead_phone"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <Label htmlFor="lead_course">Curso desejado *</Label>
            <Input
              id="lead_course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Ex.: Técnico em Enfermagem"
            />
          </div>
        </div>

        <Button onClick={submit} isLoading={isPending}>
          <UserPlus className="h-4 w-4" /> Cadastrar lead
        </Button>
      </CardContent>
    </Card>
  );
}
