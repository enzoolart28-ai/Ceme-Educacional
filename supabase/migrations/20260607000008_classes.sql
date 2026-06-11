-- =============================================================================
-- Migration: Módulo de Turmas (estende classes + units + class_students)
-- Sistema CME Educacional
-- =============================================================================
-- Estende `classes` (unidade, datas, dias/horários, professor responsável,
-- limite de alunos, status), cria `units` (unidades/polos) e `class_students`
-- (roster da turma, referenciando enrollments quando o aluno tem login).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
alter type public.class_shift add value if not exists 'sabado';

create type public.class_status as enum (
  'open',         -- Aberta
  'in_progress',  -- Em andamento
  'finished',     -- Finalizada
  'cancelled'     -- Cancelada
);

create type public.class_student_status as enum (
  'active',
  'inactive',
  'transferred',
  'cancelled'
);

-- -----------------------------------------------------------------------------
-- 2. Unidades / polos
-- -----------------------------------------------------------------------------
create table public.units (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger units_set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

alter table public.units enable row level security;
create policy "units_read" on public.units
  for select to authenticated using (true);
create policy "units_write" on public.units
  for all to authenticated
  using (public.has_permission('classes.manage') or public.has_permission('academic.manage'))
  with check (public.has_permission('classes.manage') or public.has_permission('academic.manage'));

-- -----------------------------------------------------------------------------
-- 3. Estende classes
-- -----------------------------------------------------------------------------
alter table public.classes
  add column unit_id         uuid references public.units (id) on delete set null,
  add column start_date      date,
  add column end_date        date,
  add column weekdays        text[] not null default '{}',
  add column start_time      time,
  add column end_time        time,
  add column main_teacher_id uuid references public.teachers (id) on delete set null,
  add column max_students    int,
  add column status          public.class_status not null default 'open';

update public.classes
   set status = (case when is_active then 'open' else 'cancelled' end)::public.class_status;

alter table public.classes drop column is_active;
-- Nomes de turma podem se repetir (unidades/anos diferentes); remove a unicidade.
alter table public.classes drop constraint if exists classes_name_year_key;

create index classes_status_idx on public.classes (status);
create index classes_unit_idx on public.classes (unit_id);
create index classes_main_teacher_idx on public.classes (main_teacher_id);

-- -----------------------------------------------------------------------------
-- 4. Roster da turma (class_students)
-- -----------------------------------------------------------------------------
create table public.class_students (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references public.classes (id) on delete cascade,
  student_id    uuid not null references public.students (id) on delete cascade,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  status        public.class_student_status not null default 'active',
  created_at    timestamptz not null default now(),
  unique (class_id, student_id)
);
create index class_students_class_idx on public.class_students (class_id);
create index class_students_student_idx on public.class_students (student_id);

-- -----------------------------------------------------------------------------
-- 5. RLS de classes (escopo) — recria as policies do módulo Acadêmico
-- -----------------------------------------------------------------------------
drop policy if exists "classes_read" on public.classes;
drop policy if exists "classes_write" on public.classes;

create policy "classes_read" on public.classes
  for select to authenticated
  using (
    public.is_staff()                                   -- staff vê todas
    or public.teaches_class(id)                         -- professor (atribuições)
    or public.is_enrolled(id)                           -- aluno matriculado
    or exists (                                         -- professor responsável
      select 1 from public.teachers t
       where t.id = classes.main_teacher_id
         and t.profile_id = public.current_profile_id()
    )
    or exists (                                         -- professor vinculado (teacher_classes)
      select 1 from public.teacher_classes tc
        join public.teachers t on t.id = tc.teacher_id
       where tc.class_id = classes.id
         and t.profile_id = public.current_profile_id()
    )
  );

create policy "classes_write" on public.classes
  for all to authenticated
  using (
    public.has_permission('classes.manage') or public.has_permission('academic.manage')
  )
  with check (
    public.has_permission('classes.manage') or public.has_permission('academic.manage')
  );

-- -----------------------------------------------------------------------------
-- 6. RLS de class_students
-- -----------------------------------------------------------------------------
alter table public.class_students enable row level security;

create policy "class_students_select" on public.class_students
  for select to authenticated
  using (
    public.is_staff()
    or public.teaches_class(class_id)
    or exists (
      select 1 from public.students s
       where s.id = student_id and s.profile_id = public.current_profile_id()
    )
    or public.guards_student(student_id)
  );

create policy "class_students_write" on public.class_students
  for all to authenticated
  using (
    public.has_permission('classes.manage') or public.has_permission('academic.manage')
  )
  with check (
    public.has_permission('classes.manage') or public.has_permission('academic.manage')
  );
