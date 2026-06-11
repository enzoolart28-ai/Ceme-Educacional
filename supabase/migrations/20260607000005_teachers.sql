-- =============================================================================
-- Migration: Módulo de Professores (teachers)
-- Sistema CME Educacional
-- =============================================================================
-- Tabela `teachers` (cadastro do professor; profile_id liga a um login) e
-- vínculos teacher_subjects (disciplinas que leciona) e teacher_classes
-- (turmas sob responsabilidade). O "histórico de atuação" reaproveita a
-- tabela teacher_assignments (Acadêmico), que registra disciplina × turma.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum de status
-- -----------------------------------------------------------------------------
create type public.teacher_status as enum (
  'active',    -- Ativo
  'inactive',  -- Inativo
  'on_leave',  -- Afastado
  'dismissed'  -- Desligado
);

-- -----------------------------------------------------------------------------
-- 2. Tabela teachers
-- -----------------------------------------------------------------------------
create table public.teachers (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid unique references public.profiles (id) on delete set null,
  full_name      text not null,
  cpf            text unique,
  rg             text,
  phone          text,
  email          text,
  education      text,   -- formação
  expertise_area text,   -- área de atuação
  workload       int,    -- carga horária (h/semana)
  status         public.teacher_status not null default 'active',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index teachers_status_idx on public.teachers (status);
create index teachers_profile_id_idx on public.teachers (profile_id);
create index teachers_full_name_idx on public.teachers (full_name);

create trigger teachers_set_updated_at
  before update on public.teachers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Vínculos
-- -----------------------------------------------------------------------------
create table public.teacher_subjects (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, subject_id)
);
create index teacher_subjects_teacher_idx on public.teacher_subjects (teacher_id);

create table public.teacher_classes (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, class_id)
);
create index teacher_classes_teacher_idx on public.teacher_classes (teacher_id);

-- -----------------------------------------------------------------------------
-- 4. Permissão (admin e coordenação gerenciam; secretaria/diretor só leem)
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('teachers.manage', 'Gerenciar professores', 'Cadastrar, editar e vincular professores.');

insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'teachers.manage'),
  ('coordenacao', 'teachers.manage');

-- -----------------------------------------------------------------------------
-- 5. Helper: o registro de professor pertence ao usuário logado?
-- -----------------------------------------------------------------------------
create or replace function public.owns_teacher(p_teacher uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.teachers t
     where t.id = p_teacher and t.profile_id = public.current_profile_id()
  );
$$;

-- -----------------------------------------------------------------------------
-- 6. RLS
-- -----------------------------------------------------------------------------
alter table public.teachers enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.teacher_classes enable row level security;

-- Leitura: staff (admin/diretor/coordenação/secretaria) vê todos; professor vê o próprio.
create policy "teachers_select" on public.teachers
  for select to authenticated
  using (public.is_staff() or profile_id = public.current_profile_id());

create policy "teachers_write" on public.teachers
  for all to authenticated
  using (public.has_permission('teachers.manage'))
  with check (public.has_permission('teachers.manage'));

create policy "teacher_subjects_select" on public.teacher_subjects
  for select to authenticated
  using (public.is_staff() or public.owns_teacher(teacher_id));
create policy "teacher_subjects_write" on public.teacher_subjects
  for all to authenticated
  using (public.has_permission('teachers.manage'))
  with check (public.has_permission('teachers.manage'));

create policy "teacher_classes_select" on public.teacher_classes
  for select to authenticated
  using (public.is_staff() or public.owns_teacher(teacher_id));
create policy "teacher_classes_write" on public.teacher_classes
  for all to authenticated
  using (public.has_permission('teachers.manage'))
  with check (public.has_permission('teachers.manage'));
