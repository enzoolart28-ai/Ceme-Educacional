-- =============================================================================
-- Migration: Módulo de Cursos (estende courses + disciplinas/módulos)
-- Sistema CME Educacional
-- =============================================================================
-- Estende a tabela `courses` (criada no módulo Acadêmico) com modalidade, tipo,
-- valor, status, certificado, frequência/média mínimas e requisitos. Cria
-- `course_subjects` (disciplinas do curso) e `course_modules` (módulos).
-- Substitui o antigo `is_active` por `status`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.course_modality as enum ('presencial', 'semipresencial', 'ead');

create type public.course_type as enum (
  'tecnico',
  'profissionalizante',
  'livre',
  'infantil',
  'preparatorio',
  'reforco'
);

create type public.course_status as enum (
  'active',    -- Ativo
  'inactive',  -- Inativo
  'planning',  -- Em planejamento
  'closed'     -- Encerrado
);

-- -----------------------------------------------------------------------------
-- 2. Estende courses
-- -----------------------------------------------------------------------------
alter table public.courses
  add column modality            public.course_modality not null default 'presencial',
  add column type                public.course_type     not null default 'livre',
  add column workload_hours      int,
  add column duration            text,
  add column price               numeric(10, 2),
  add column status              public.course_status   not null default 'active',
  add column certificate_enabled boolean not null default false,
  add column minimum_attendance  int,            -- frequência mínima (%)
  add column minimum_grade       numeric(4, 2),  -- média mínima
  add column requirements        text,
  add column notes               text;

-- Migra is_active -> status e remove a coluna antiga.
update public.courses
   set status = (case when is_active then 'active' else 'inactive' end)::public.course_status;
alter table public.courses drop column is_active;

create index courses_status_idx on public.courses (status);
create index courses_type_idx on public.courses (type);
create index courses_modality_idx on public.courses (modality);

-- -----------------------------------------------------------------------------
-- 3. Disciplinas do curso e módulos
-- -----------------------------------------------------------------------------
create table public.course_subjects (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (course_id, subject_id)
);
create index course_subjects_course_idx on public.course_subjects (course_id);

create table public.course_modules (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses (id) on delete cascade,
  name           text not null,
  description    text,
  position       int  not null default 0,
  workload_hours int,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index course_modules_course_idx on public.course_modules (course_id);

create trigger course_modules_set_updated_at
  before update on public.course_modules
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Permissão (admin, direção, coordenação e secretaria gerenciam cursos)
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('courses.manage', 'Gerenciar cursos', 'Cadastrar, editar cursos, disciplinas e módulos.');

insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'courses.manage'),
  ('diretor', 'courses.manage'),
  ('coordenacao', 'courses.manage'),
  ('secretaria', 'courses.manage');

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------
-- courses já tem RLS habilitada (Acadêmico). Recriamos as policies com escopo:
--   - staff: tudo;
--   - aluno: cursos em que está matriculado;
--   - professor: cursos das turmas que leciona.
drop policy if exists "courses_read" on public.courses;
drop policy if exists "courses_write" on public.courses;

create policy "courses_read" on public.courses
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.enrollments e
        join public.classes c on c.id = e.class_id
       where c.course_id = courses.id
         and e.student_id = public.current_profile_id()
    )
    or exists (
      select 1 from public.teacher_assignments ta
        join public.classes c on c.id = ta.class_id
       where c.course_id = courses.id
         and ta.teacher_id = public.current_profile_id()
    )
  );

create policy "courses_write" on public.courses
  for all to authenticated
  using (public.has_permission('courses.manage'))
  with check (public.has_permission('courses.manage'));

alter table public.course_subjects enable row level security;
alter table public.course_modules enable row level security;

create policy "course_subjects_read" on public.course_subjects
  for select to authenticated using (true);
create policy "course_subjects_write" on public.course_subjects
  for all to authenticated
  using (public.has_permission('courses.manage'))
  with check (public.has_permission('courses.manage'));

create policy "course_modules_read" on public.course_modules
  for select to authenticated using (true);
create policy "course_modules_write" on public.course_modules
  for all to authenticated
  using (public.has_permission('courses.manage'))
  with check (public.has_permission('courses.manage'));
