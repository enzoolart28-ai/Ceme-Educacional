-- =============================================================================
-- Migration: Módulo de Chamada e Frequência
-- Sistema CME Educacional
-- =============================================================================
-- Chamadas (attendance) por turma/disciplina/professor/data, com registros por
-- aluno (attendance_records) e log de alterações (attendance_logs).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.attendance_status as enum ('open', 'finalized');

create type public.attendance_record_status as enum (
  'present',            -- Presente
  'absent',             -- Falta
  'justified_absence',  -- Falta justificada
  'late'                -- Atraso
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.attendance (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  teacher_id uuid references public.teachers (id) on delete set null,
  date       date not null,
  start_time time,
  end_time   time,
  status     public.attendance_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, subject_id, date)
);
create index attendance_class_idx on public.attendance (class_id);
create index attendance_date_idx on public.attendance (date);

create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

create table public.attendance_records (
  id            uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.attendance (id) on delete cascade,
  student_id    uuid not null references public.students (id) on delete cascade,
  status        public.attendance_record_status not null default 'present',
  observation   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (attendance_id, student_id)
);
create index attendance_records_attendance_idx on public.attendance_records (attendance_id);
create index attendance_records_student_idx on public.attendance_records (student_id);

create trigger attendance_records_set_updated_at
  before update on public.attendance_records
  for each row execute function public.set_updated_at();

create table public.attendance_logs (
  id            uuid primary key default gen_random_uuid(),
  attendance_id uuid references public.attendance (id) on delete cascade,
  changed_by    uuid references public.profiles (id) on delete set null,
  action        text not null,
  detail        text,
  created_at    timestamptz not null default now()
);
create index attendance_logs_attendance_idx on public.attendance_logs (attendance_id);

-- -----------------------------------------------------------------------------
-- 3. Helper: pode gerenciar a chamada desta turma?
-- -----------------------------------------------------------------------------
-- Professor com grades.manage nas turmas que leciona, ou quem tem classes.manage
-- (coordenação/admin). Secretaria (sem grades.manage) só visualiza.
create or replace function public.can_manage_attendance(p_class uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.has_permission('grades.manage')
     and (public.teaches_class(p_class) or public.has_permission('classes.manage'));
$$;

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
alter table public.attendance enable row level security;
alter table public.attendance_records enable row level security;
alter table public.attendance_logs enable row level security;

-- attendance: leitura por escopo
create policy "attendance_select" on public.attendance
  for select to authenticated
  using (
    public.is_staff()
    or public.teaches_class(class_id)
    or public.is_enrolled(class_id)
    or exists (
      select 1 from public.class_students cs
        join public.students s on s.id = cs.student_id
       where cs.class_id = attendance.class_id
         and public.guards_student(s.id)
    )
  );
create policy "attendance_write" on public.attendance
  for all to authenticated
  using (public.can_manage_attendance(class_id))
  with check (public.can_manage_attendance(class_id));

-- attendance_records: leitura por escopo (staff, professor da turma, próprio aluno, responsável)
create policy "attendance_records_select" on public.attendance_records
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.attendance a
       where a.id = attendance_id and public.teaches_class(a.class_id)
    )
    or exists (
      select 1 from public.students s
       where s.id = student_id and s.profile_id = public.current_profile_id()
    )
    or public.guards_student(student_id)
  );
create policy "attendance_records_write" on public.attendance_records
  for all to authenticated
  using (
    exists (
      select 1 from public.attendance a
       where a.id = attendance_id and public.can_manage_attendance(a.class_id)
    )
  )
  with check (
    exists (
      select 1 from public.attendance a
       where a.id = attendance_id and public.can_manage_attendance(a.class_id)
    )
  );

-- attendance_logs: leitura staff/professor; escrita por quem gerencia chamada
create policy "attendance_logs_select" on public.attendance_logs
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.attendance a
       where a.id = attendance_id and public.teaches_class(a.class_id)
    )
  );
create policy "attendance_logs_insert" on public.attendance_logs
  for insert to authenticated
  with check (public.has_permission('grades.manage'));
