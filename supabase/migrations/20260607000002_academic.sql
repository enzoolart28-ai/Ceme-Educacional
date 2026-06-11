-- =============================================================================
-- Migration: Módulo Acadêmico
-- Sistema CME Educacional
-- =============================================================================
-- Entidades: courses, subjects, classes, enrollments, teacher_assignments,
-- student_guardians. Inclui helpers de escopo (SECURITY DEFINER) e RLS por
-- perfil, refletindo as regras:
--   - aluno: apenas seus próprios dados;
--   - responsável: alunos vinculados;
--   - professor: suas turmas;
--   - secretaria/coordenação/diretor/admin: conforme permissões.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.class_shift as enum ('manha', 'tarde', 'noite', 'integral');

create type public.enrollment_status as enum (
  'active',       -- matriculado
  'transferred',  -- transferido
  'cancelled',    -- cancelado
  'completed'     -- concluído
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.subjects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  course_id  uuid not null references public.courses (id) on delete restrict,
  year       int  not null,
  shift      public.class_shift not null default 'manha',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, year)
);
create index classes_course_id_idx on public.classes (course_id);

create table public.enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  class_id    uuid not null references public.classes (id) on delete cascade,
  status      public.enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (student_id, class_id)
);
create index enrollments_student_idx on public.enrollments (student_id);
create index enrollments_class_idx on public.enrollments (class_id);

create table public.teacher_assignments (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, class_id, subject_id)
);
create index teacher_assignments_teacher_idx on public.teacher_assignments (teacher_id);
create index teacher_assignments_class_idx on public.teacher_assignments (class_id);

create table public.student_guardians (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles (id) on delete cascade,
  guardian_id  uuid not null references public.profiles (id) on delete cascade,
  relationship text not null default 'responsavel',
  created_at   timestamptz not null default now(),
  unique (student_id, guardian_id)
);
create index student_guardians_student_idx on public.student_guardians (student_id);
create index student_guardians_guardian_idx on public.student_guardians (guardian_id);

-- -----------------------------------------------------------------------------
-- 3. updated_at triggers (reutiliza public.set_updated_at)
-- -----------------------------------------------------------------------------
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();
create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();
create trigger enrollments_set_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Helpers de escopo (SECURITY DEFINER, sem recursão de RLS)
-- -----------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.teaches_class(p_class uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_assignments ta
     where ta.class_id = p_class
       and ta.teacher_id = public.current_profile_id()
  );
$$;

create or replace function public.is_enrolled(p_class uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments e
     where e.class_id = p_class
       and e.student_id = public.current_profile_id()
  );
$$;

create or replace function public.is_guardian_of(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.student_guardians sg
     where sg.student_id = p_student
       and sg.guardian_id = public.current_profile_id()
  );
$$;

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.student_guardians enable row level security;

-- Catálogos (courses, subjects, classes, teacher_assignments): leitura para
-- qualquer autenticado; escrita conforme permissão.
create policy "courses_read" on public.courses
  for select to authenticated using (true);
create policy "courses_write" on public.courses
  for all to authenticated
  using (public.has_permission('academic.manage'))
  with check (public.has_permission('academic.manage'));

create policy "subjects_read" on public.subjects
  for select to authenticated using (true);
create policy "subjects_write" on public.subjects
  for all to authenticated
  using (public.has_permission('academic.manage'))
  with check (public.has_permission('academic.manage'));

create policy "classes_read" on public.classes
  for select to authenticated using (true);
create policy "classes_write" on public.classes
  for all to authenticated
  using (
    public.has_permission('classes.manage')
    or public.has_permission('academic.manage')
  )
  with check (
    public.has_permission('classes.manage')
    or public.has_permission('academic.manage')
  );

create policy "teacher_assignments_read" on public.teacher_assignments
  for select to authenticated using (true);
create policy "teacher_assignments_write" on public.teacher_assignments
  for all to authenticated
  using (
    public.has_permission('classes.manage')
    or public.has_permission('academic.manage')
  )
  with check (
    public.has_permission('classes.manage')
    or public.has_permission('academic.manage')
  );

-- Matrículas: leitura por escopo; escrita por academic.manage (secretaria/admin).
create policy "enrollments_read" on public.enrollments
  for select to authenticated
  using (
    public.has_permission('academic.read')      -- staff (admin/diretor/coord/secretaria)
    or student_id = public.current_profile_id()  -- aluno: própria matrícula
    or public.teaches_class(class_id)            -- professor: turmas que leciona
    or public.is_guardian_of(student_id)         -- responsável: alunos vinculados
  );
create policy "enrollments_write" on public.enrollments
  for all to authenticated
  using (public.has_permission('academic.manage'))
  with check (public.has_permission('academic.manage'));

-- Vínculo responsável-aluno: leitura por escopo; escrita por academic.manage.
create policy "student_guardians_read" on public.student_guardians
  for select to authenticated
  using (
    public.has_permission('academic.read')
    or guardian_id = public.current_profile_id()
    or student_id = public.current_profile_id()
  );
create policy "student_guardians_write" on public.student_guardians
  for all to authenticated
  using (public.has_permission('academic.manage'))
  with check (public.has_permission('academic.manage'));
