-- =============================================================================
-- Migration: Módulo de Calendário Acadêmico
-- Sistema CME Educacional
-- =============================================================================
-- Eventos do calendário (aulas, provas, reuniões, feriados, vencimentos…) com
-- escopo por curso/turma/unidade/professor e visibilidade. RLS define quem vê e
-- quem cria cada tipo de evento.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.calendar_event_type as enum (
  'aula',
  'prova',
  'atividade',
  'reuniao',
  'feriado',
  'institucional',
  'vencimento_financeiro',
  'palestra'
);

create type public.event_visibility as enum (
  'public',      -- visível a qualquer usuário logado
  'restricted'   -- só envolvidos (turma/curso) + equipe
);

-- -----------------------------------------------------------------------------
-- 2. Tabela
-- -----------------------------------------------------------------------------
create table public.calendar_events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  type           public.calendar_event_type not null default 'aula',
  start_datetime timestamptz not null,
  end_datetime   timestamptz,
  course_id      uuid references public.courses (id) on delete set null,
  class_id       uuid references public.classes (id) on delete set null,
  unit_id        uuid references public.units (id) on delete set null,
  teacher_id     uuid references public.teachers (id) on delete set null,
  location       text,
  visibility     public.event_visibility not null default 'restricted',
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index calendar_events_start_idx on public.calendar_events (start_datetime);
create index calendar_events_class_idx on public.calendar_events (class_id);
create index calendar_events_course_idx on public.calendar_events (course_id);
create index calendar_events_type_idx on public.calendar_events (type);

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------
alter table public.calendar_events enable row level security;

-- Quem vê o evento:
--  • públicos: todos os autenticados
--  • o próprio criador / staff (admin/direção/coordenação/secretaria): tudo
--  • financeiro: vencimentos financeiros (finance.read)
--  • turma: aluno matriculado / professor da turma / responsável de aluno da turma
--  • curso: aluno do curso / responsável / professor de turma do curso
create policy "calendar_events_select" on public.calendar_events
  for select to authenticated
  using (
    visibility = 'public'
    or created_by = public.current_profile_id()
    or public.is_staff()
    or (type = 'vencimento_financeiro' and public.has_permission('finance.read'))
    or (
      class_id is not null and (
        public.is_enrolled(class_id)
        or public.teaches_class(class_id)
        or exists (
          select 1 from public.class_students cs
            join public.students s on s.id = cs.student_id
           where cs.class_id = calendar_events.class_id and public.guards_student(s.id)
        )
      )
    )
    or (
      course_id is not null and (
        public.enrolled_in_course(course_id)
        or public.guardian_of_course_student(course_id)
        or exists (
          select 1 from public.classes c
           where c.course_id = calendar_events.course_id and public.teaches_class(c.id)
        )
      )
    )
  );

-- Quem cria: staff (qualquer); financeiro (só vencimentos); professor (eventos
-- pedagógicos da turma que leciona). created_by sempre = o próprio.
create policy "calendar_events_insert" on public.calendar_events
  for insert to authenticated
  with check (
    created_by = public.current_profile_id()
    and (
      public.is_staff()
      or (type = 'vencimento_financeiro' and public.has_permission('finance.manage'))
      or (class_id is not null and public.teaches_class(class_id))
    )
  );

-- Edita/exclui: criador ou staff.
create policy "calendar_events_update" on public.calendar_events
  for update to authenticated
  using (created_by = public.current_profile_id() or public.is_staff())
  with check (created_by = public.current_profile_id() or public.is_staff());
create policy "calendar_events_delete" on public.calendar_events
  for delete to authenticated
  using (created_by = public.current_profile_id() or public.is_staff());
