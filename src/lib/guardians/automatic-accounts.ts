import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { onlyDigits } from "@/lib/students/cpf";

const INITIAL_PASSWORD = "123456";

interface StudentForGuardian {
  id: string;
  cpf: string | null;
  mother_name: string | null;
  father_name: string | null;
}

export interface GuardianGenerationResult {
  families: number;
  accountsCreated: number;
  studentsLinked: number;
  skipped: number;
}

function normalizedName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function familyFor(student: StudentForGuardian) {
  const mother = student.mother_name?.trim();
  const father = student.father_name?.trim();
  const name = mother || father;
  if (!name) return null;
  const kinship = mother ? "Mae" : "Pai";
  return {
    name,
    kinship,
    key: `${kinship.toLowerCase()}:${normalizedName(name)}`,
  };
}

export async function generateAutomaticGuardianAccounts(
  studentIds?: string[],
): Promise<GuardianGenerationResult> {
  const admin = createAdminClient();
  let studentsQuery = admin
    .from("students")
    .select("id, cpf, mother_name, father_name")
    .is("deleted_at", null);
  if (studentIds?.length) studentsQuery = studentsQuery.in("id", studentIds);

  const { data: studentRows, error: studentsError } = await studentsQuery;
  if (studentsError) throw studentsError;

  const groups = new Map<string, { name: string; kinship: string; students: StudentForGuardian[] }>();
  let skipped = 0;
  for (const student of (studentRows ?? []) as StudentForGuardian[]) {
    const family = familyFor(student);
    const cpf = onlyDigits(student.cpf ?? "");
    if (!family || cpf.length !== 11) {
      skipped += 1;
      continue;
    }
    const group = groups.get(family.key) ?? { name: family.name, kinship: family.kinship, students: [] };
    group.students.push(student);
    groups.set(family.key, group);
  }

  const { data: existingGuardians } = await admin
    .from("guardians")
    .select("id, profile_id, full_name, auto_family_key");

  let accountsCreated = 0;
  let studentsLinked = 0;

  for (const [familyKey, group] of groups) {
    let guardian = (existingGuardians ?? []).find((row) => row.auto_family_key === familyKey);
    if (!guardian) {
      const nameMatches = (existingGuardians ?? []).filter(
        (row) => normalizedName(row.full_name) === normalizedName(group.name),
      );
      if (nameMatches.length === 1) {
        guardian = nameMatches[0];
        await admin.from("guardians").update({ auto_family_key: familyKey }).eq("id", guardian.id);
      }
    }

    if (!guardian) {
      const { data, error } = await admin
        .from("guardians")
        .insert({
          full_name: group.name,
          kinship: group.kinship,
          auto_family_key: familyKey,
          review_required: true,
          notes: "Conta familiar gerada automaticamente. Dados do responsavel devem ser revisados pela secretaria.",
        })
        .select("id, profile_id, full_name, auto_family_key")
        .single();
      if (error) throw error;
      guardian = data;
      existingGuardians?.push(data);
    }

    if (!guardian.profile_id) {
      const authEmail = `responsavel.${guardian.id}@cme.local`;
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: authEmail,
        password: INITIAL_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: guardian.full_name, role: "responsavel" },
      });
      if (authError) throw authError;

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .update({
          full_name: guardian.full_name,
          role: "responsavel",
          status: "active",
          must_change_password: true,
        })
        .eq("user_id", authData.user.id)
        .select("id")
        .single();
      if (profileError) throw profileError;

      const { error: guardianError } = await admin
        .from("guardians")
        .update({
          profile_id: profile.id,
          email: authEmail,
          account_created_at: new Date().toISOString(),
        })
        .eq("id", guardian.id);
      if (guardianError) throw guardianError;
      guardian.profile_id = profile.id;
      accountsCreated += 1;
    }

    for (const student of group.students) {
      const cpf = onlyDigits(student.cpf ?? "");
      const { error: linkError } = await admin.from("student_guardians").upsert(
        {
          guardian_id: guardian.id,
          student_id: student.id,
          is_financial_responsible: true,
          is_pedagogical_responsible: true,
        },
        { onConflict: "student_id,guardian_id" },
      );
      if (linkError) throw linkError;

      const { error: aliasError } = await admin.from("guardian_login_aliases").upsert(
        { guardian_id: guardian.id, student_id: student.id, login_cpf: cpf },
        { onConflict: "student_id" },
      );
      if (aliasError) {
        await admin.from("guardians").update({ review_required: true }).eq("id", guardian.id);
        skipped += 1;
        continue;
      }
      studentsLinked += 1;
    }
  }

  return { families: groups.size, accountsCreated, studentsLinked, skipped };
}
