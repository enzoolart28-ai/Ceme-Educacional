-- =============================================================================
-- Migration: Módulo Comercial / CRM
-- Sistema CME Educacional
-- =============================================================================
-- Leads (interessados), histórico de atendimento (lead_interactions) e conversão
-- em aluno. Não existe um perfil "comercial" no enum de papéis, então o acesso é
-- via permissão `leads.manage` (admin/direção/coordenação/secretaria).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.lead_source as enum (
  'instagram', 'whatsapp', 'facebook', 'indicacao', 'evento',
  'palestra', 'escola_parceira', 'site', 'outro'
);

create type public.lead_status as enum (
  'novo', 'em_atendimento', 'aguardando_retorno', 'agendado',
  'compareceu', 'matriculado', 'desistiu', 'sem_resposta'
);

create type public.lead_interaction_type as enum (
  'ligacao', 'whatsapp', 'email', 'presencial', 'agendamento', 'observacao', 'outro'
);

-- -----------------------------------------------------------------------------
-- 2. Permissão de gestão de leads (comercial) + vínculo aos papéis
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('leads.manage', 'Gerenciar leads (CRM)', 'Cadastrar e atender leads comerciais.')
  on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'leads.manage'),
  ('diretor', 'leads.manage'),
  ('coordenacao', 'leads.manage'),
  ('secretaria', 'leads.manage')
  on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Tabelas
-- -----------------------------------------------------------------------------
create table public.leads (
  id                   uuid primary key default gen_random_uuid(),
  full_name            text not null,
  phone                text,
  email                text,
  age                  int,
  guardian_name        text,
  course_interest      text,
  source               public.lead_source not null default 'outro',
  city                 text,
  status               public.lead_status not null default 'novo',
  notes                text,
  converted_student_id uuid references public.students (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index leads_status_idx on public.leads (status);
create index leads_source_idx on public.leads (source);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create table public.lead_interactions (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads (id) on delete cascade,
  user_id          uuid references public.profiles (id) on delete set null,
  interaction_type public.lead_interaction_type not null default 'observacao',
  description      text,
  next_contact_at  timestamptz,
  created_at       timestamptz not null default now()
);
create index lead_interactions_lead_idx on public.lead_interactions (lead_id);

-- -----------------------------------------------------------------------------
-- 4. RLS — gestão por leads.manage; exclusão só admin.
-- -----------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.lead_interactions enable row level security;

create policy "leads_select" on public.leads
  for select to authenticated using (public.has_permission('leads.manage'));
create policy "leads_insert" on public.leads
  for insert to authenticated with check (public.has_permission('leads.manage'));
create policy "leads_update" on public.leads
  for update to authenticated
  using (public.has_permission('leads.manage'))
  with check (public.has_permission('leads.manage'));
create policy "leads_delete" on public.leads
  for delete to authenticated using (public.current_user_role() = 'admin');

create policy "lead_interactions_select" on public.lead_interactions
  for select to authenticated using (public.has_permission('leads.manage'));
create policy "lead_interactions_insert" on public.lead_interactions
  for insert to authenticated
  with check (public.has_permission('leads.manage') and user_id = public.current_profile_id());
create policy "lead_interactions_delete" on public.lead_interactions
  for delete to authenticated using (public.current_user_role() = 'admin');
