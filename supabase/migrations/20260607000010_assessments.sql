-- =============================================================================
-- Migration: Módulo de Notas e Avaliações
-- Sistema CME Educacional
-- =============================================================================
-- Avaliações (assessments) por turma/disciplina/professor, notas por aluno
-- (grades) e log de alterações (grade_logs). A média mínima de aprovação vem
-- de courses.minimum_grade.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum de tipo de avaliação
-- -----------------------------------------------------------------------------
create type public.assessment_type as enum (
  'prova',
  'trabalho',
  'atividade',
  'participacao',
  'recuperacao',
  'projeto',
  'pratica'  -- avaliação prática
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.assessments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       public.assessment_type not null default 'prova',
  course_id  uuid references public.courses (id) on delete set null,
  class_id   uuid not null references public.classes (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  teacher_id uuid references public.teachers (id) on delete set null,
  weight     numeric(5, 2) not null default 1,
  max_grade  numeric(5, 2) not null default 10,
  date       date,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assessments_class_idx on public.assessments (class_id);
create index assessments_subject_idx on public.assessments (subject_id);

create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

create table public.grades (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  student_id    uuid not null references public.students (id) on delete cascade,
  grade         numeric(5, 2),
  feedback      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (assessment_id, student_id)
);
create index grades_assessment_idx on public.grades (assessment_id);
create index grades_student_idx on public.grades (student_id);

create trigger grades_set_updated_at
  before update on public.grades
  for each row execute function public.set_updated_at();

create table public.grade_logs (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments (id) on delete cascade,
  changed_by    uuid references public.profiles (id) on delete set null,
  action        text not null,
  detail        text,
  created_at    timestamptz not null default now()
);
create index grade_logs_assessment_idx on public.grade_logs (assessment_id);

-- -----------------------------------------------------------------------------
-- 3. Helper: pode gerenciar notas desta turma?
-- -----------------------------------------------------------------------------
create or replace function public.can_manage_grades(p_class uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.has_permission('grades.manage')
     and (public.teaches_class(p_class) or public.has_permission('classes.manage'));
$$;

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
alter table public.assessments enable row level security;
alter table public.grades enable row level security;
alter table public.grade_logs enable row level security;

create policy "assessments_select" on public.assessments
  for select to authenticated
  using (
    public.is_staff()
    or public.teaches_class(class_id)
    or public.is_enrolled(class_id)
    or exists (
      select 1 from public.class_students cs
        join public.students s on s.id = cs.student_id
       where cs.class_id = assessments.class_id
         and public.guards_student(s.id)
    )
  );
create policy "assessments_write" on public.assessments
  for all to authenticated
  using (public.can_manage_grades(class_id))
  with check (public.can_manage_grades(class_id));

create policy "grades_select" on public.grades
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.assessments a
       where a.id = assessment_id and public.teaches_class(a.class_id)
    )
    or exists (
      select 1 from public.students s
       where s.id = student_id and s.profile_id = public.current_profile_id()
    )
    or public.guards_student(student_id)
  );
create policy "grades_write" on public.grades
  for all to authenticated
  using (
    exists (
      select 1 from public.assessments a
       where a.id = assessment_id and public.can_manage_grades(a.class_id)
    )
  )
  with check (
    exists (
      select 1 from public.assessments a
       where a.id = assessment_id and public.can_manage_grades(a.class_id)
    )
  );

create policy "grade_logs_select" on public.grade_logs
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.assessments a
       where a.id = assessment_id and public.teaches_class(a.class_id)
    )
  );
create policy "grade_logs_insert" on public.grade_logs
  for insert to authenticated
  with check (public.has_permission('grades.manage'));
