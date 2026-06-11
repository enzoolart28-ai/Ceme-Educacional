-- =============================================================================
-- Migration: Módulo de Responsáveis (guardians)
-- Sistema CME Educacional
-- =============================================================================
-- Cria a tabela `guardians` (cadastro do responsável) e reestrutura
-- `student_guardians` para ligar students ↔ guardians, com flags de
-- responsável financeiro e pedagógico.
--
-- A `student_guardians` original (módulo Acadêmico) ligava profiles↔profiles.
-- Aqui ela é recriada. Para soltar a dependência da função is_guardian_of
-- (SQL) na tabela antiga, primeiro a função vira um stub, a tabela é dropada,
-- e a função é redefinida no novo modelo ao final.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Quebra a dependência da função na tabela antiga e dropa a tabela
-- -----------------------------------------------------------------------------
create or replace function public.is_guardian_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select false $$;

drop table if exists public.student_guardians cascade;

-- -----------------------------------------------------------------------------
-- 2. Tabela guardians
-- -----------------------------------------------------------------------------
create table public.guardians (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references public.profiles (id) on delete set null, -- login (acesso ao painel)
  full_name   text not null,
  cpf         text unique,
  rg          text,
  phone       text,
  email       text,
  address     text,
  city        text,
  state       text,
  kinship     text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index guardians_full_name_idx on public.guardians (full_name);
create index guardians_profile_id_idx on public.guardians (profile_id);

create trigger guardians_set_updated_at
  before update on public.guardians
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Vínculo aluno ↔ responsável (com flags)
-- -----------------------------------------------------------------------------
create table public.student_guardians (
  id                          uuid primary key default gen_random_uuid(),
  student_id                  uuid not null references public.students (id) on delete cascade,
  guardian_id                 uuid not null references public.guardians (id) on delete cascade,
  is_financial_responsible    boolean not null default false,
  is_pedagogical_responsible  boolean not null default false,
  created_at                  timestamptz not null default now(),
  unique (student_id, guardian_id)
);

create index student_guardians_student_idx on public.student_guardians (student_id);
create index student_guardians_guardian_idx on public.student_guardians (guardian_id);

-- -----------------------------------------------------------------------------
-- 4. Helpers de escopo (novo modelo)
-- -----------------------------------------------------------------------------
create or replace function public.current_guardian_id()
returns uuid language sql stable security definer set search_path = public
as $$
  select id from public.guardians where profile_id = public.current_profile_id();
$$;

-- Recebe students.id. Verdadeiro se o usuário logado é responsável do aluno.
create or replace function public.guards_student(p_student_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.student_guardians sg
      join public.guardians g on g.id = sg.guardian_id
     where sg.student_id = p_student_id
       and g.profile_id = public.current_profile_id()
  );
$$;

-- Recebe o PROFILE id do aluno (mantém a assinatura usada por enrollments_read).
-- O nome do parâmetro deve permanecer "p_student" (create or replace não troca nome).
create or replace function public.is_guardian_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.students s
      join public.student_guardians sg on sg.student_id = s.id
      join public.guardians g on g.id = sg.guardian_id
     where s.profile_id = p_student
       and g.profile_id = public.current_profile_id()
  );
$$;

-- -----------------------------------------------------------------------------
-- 5. Permissão (secretaria, coordenação e admin gerenciam responsáveis)
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('guardians.manage', 'Gerenciar responsáveis', 'Cadastrar, editar e vincular responsáveis.');

insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'guardians.manage'),
  ('secretaria', 'guardians.manage'),
  ('coordenacao', 'guardians.manage');

-- -----------------------------------------------------------------------------
-- 6. RLS
-- -----------------------------------------------------------------------------
alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;

create policy "guardians_select" on public.guardians
  for select to authenticated
  using (
    public.has_permission('guardians.manage')
    or public.has_permission('students.read')
    or profile_id = public.current_profile_id()
  );
create policy "guardians_write" on public.guardians
  for all to authenticated
  using (public.has_permission('guardians.manage'))
  with check (public.has_permission('guardians.manage'));

create policy "student_guardians_select" on public.student_guardians
  for select to authenticated
  using (
    public.has_permission('guardians.manage')
    or public.has_permission('students.read')
    or guardian_id = public.current_guardian_id()
    or exists (
      select 1 from public.students s
       where s.id = student_id and s.profile_id = public.current_profile_id()
    )
  );
create policy "student_guardians_write" on public.student_guardians
  for all to authenticated
  using (public.has_permission('guardians.manage'))
  with check (public.has_permission('guardians.manage'));

-- -----------------------------------------------------------------------------
-- 7. Recriar students_select para o responsável enxergar alunos vinculados
--    mesmo quando o aluno não tem conta de login (usa students.id).
-- -----------------------------------------------------------------------------
drop policy if exists "students_select" on public.students;
create policy "students_select" on public.students
  for select to authenticated
  using (
    public.has_permission('students.manage')                       -- gestores
    or (profile_id = public.current_profile_id())                  -- o próprio aluno
    or public.guards_student(id)                                   -- responsável vinculado
    or (                                                            -- professor: suas turmas
      public.has_permission('students.read')
      and profile_id is not null
      and exists (
        select 1
          from public.enrollments e
          join public.teacher_assignments ta on ta.class_id = e.class_id
         where e.student_id = public.students.profile_id
           and ta.teacher_id = public.current_profile_id()
      )
    )
  );
