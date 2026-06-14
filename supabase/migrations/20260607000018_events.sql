-- =============================================================================
-- Migration: Módulo de Eventos e Palestras
-- Sistema CME Educacional
-- =============================================================================
-- Eventos institucionais (events) com inscrição PÚBLICA (sem login), lista de
-- inscritos (event_registrations), presença e conversão em lead/aluno.
-- A inscrição pública entra pela função SECURITY DEFINER register_for_event,
-- que valida "aberto" + limite; o painel interno exige a permissão leads.manage.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum de status do evento
-- -----------------------------------------------------------------------------
create type public.event_status as enum (
  'planejado',
  'aberto_inscricao',
  'encerrado',
  'cancelado',
  'finalizado'
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.events (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  date                date,
  start_time          time,
  end_time            time,
  location            text,
  target_audience     text,
  max_registrations   int,
  responsible_user_id uuid references public.profiles (id) on delete set null,
  status              public.event_status not null default 'planejado',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index events_status_idx on public.events (status);
create index events_date_idx on public.events (date);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create table public.event_registrations (
  id                   uuid primary key default gen_random_uuid(),
  event_id             uuid not null references public.events (id) on delete cascade,
  full_name            text not null,
  phone                text,
  email                text,
  age                  int,
  guardian_name        text,
  course_interest      text,
  city                 text,
  school               text,
  notes                text,
  attended             boolean not null default false,
  converted_to_lead    boolean not null default false,
  converted_to_student boolean not null default false,
  lead_id              uuid references public.leads (id) on delete set null,
  student_id           uuid references public.students (id) on delete set null,
  created_at           timestamptz not null default now()
);
create index event_registrations_event_idx on public.event_registrations (event_id);

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

-- events: anônimo vê só os abertos (página pública); gestor vê/gerencia tudo.
create policy "events_public_select" on public.events
  for select to anon using (status = 'aberto_inscricao');
create policy "events_internal_select" on public.events
  for select to authenticated
  using (public.has_permission('leads.manage') or status = 'aberto_inscricao');
create policy "events_write" on public.events
  for all to authenticated
  using (public.has_permission('leads.manage'))
  with check (public.has_permission('leads.manage'));

-- event_registrations: NUNCA legível por anônimo; gestor lê e gerencia.
-- (inscrição pública é feita pela função register_for_event, SECURITY DEFINER.)
create policy "event_registrations_select" on public.event_registrations
  for select to authenticated using (public.has_permission('leads.manage'));
create policy "event_registrations_write" on public.event_registrations
  for all to authenticated
  using (public.has_permission('leads.manage'))
  with check (public.has_permission('leads.manage'));

-- -----------------------------------------------------------------------------
-- 4. Inscrição pública (valida evento aberto + limite de vagas)
-- -----------------------------------------------------------------------------
create or replace function public.register_for_event(
  p_event uuid,
  p_full_name text,
  p_phone text default null,
  p_email text default null,
  p_age int default null,
  p_guardian text default null,
  p_course text default null,
  p_city text default null,
  p_school text default null,
  p_notes text default null
)
returns text language plpgsql security definer set search_path = public
as $$
declare
  v_event public.events;
  v_count int;
begin
  select * into v_event from public.events where id = p_event;
  if v_event.id is null then return 'NAO_ENCONTRADO'; end if;
  if v_event.status <> 'aberto_inscricao' then return 'INSCRICOES_FECHADAS'; end if;
  if coalesce(btrim(p_full_name), '') = '' then return 'NOME_OBRIGATORIO'; end if;
  if v_event.max_registrations is not null then
    select count(*) into v_count from public.event_registrations where event_id = p_event;
    if v_count >= v_event.max_registrations then return 'LOTADO'; end if;
  end if;

  insert into public.event_registrations
    (event_id, full_name, phone, email, age, guardian_name, course_interest, city, school, notes)
  values (
    p_event, btrim(p_full_name), nullif(p_phone, ''), nullif(p_email, ''), p_age,
    nullif(p_guardian, ''), nullif(p_course, ''), nullif(p_city, ''), nullif(p_school, ''), nullif(p_notes, '')
  );
  return 'ok';
end;
$$;

revoke all on function public.register_for_event(uuid, text, text, text, int, text, text, text, text, text) from public;
grant execute on function public.register_for_event(uuid, text, text, text, int, text, text, text, text, text) to anon, authenticated;
