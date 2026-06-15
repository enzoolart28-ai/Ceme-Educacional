-- =============================================================================
-- Migration: Módulo de Campanhas, Sorteios e Desafios
-- Sistema CME Educacional
-- =============================================================================
-- Campanhas educacionais (ex.: "Desafio Labirinto Digital") com níveis de
-- desafio, participantes, progresso por nível, ranking, elegibilidade para
-- sorteio e ganhadores. Tudo interno — permissão campaigns.manage.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.campaign_status as enum ('rascunho', 'ativa', 'encerrada', 'cancelada');

create type public.campaign_participant_status as enum (
  'inscrito', 'em_andamento', 'concluido', 'desistente'
);

create type public.campaign_level_difficulty as enum ('facil', 'medio', 'dificil');

-- -----------------------------------------------------------------------------
-- 2. Permissão (admin/coordenação/secretaria) — admin já passa pelo short-circuit
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('campaigns.manage', 'Gerenciar campanhas', 'Campanhas, desafios e sorteios.')
  on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'campaigns.manage'),
  ('coordenacao', 'campaigns.manage'),
  ('secretaria', 'campaigns.manage')
  on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Tabelas
-- -----------------------------------------------------------------------------
create table public.campaigns (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  start_date      date,
  end_date        date,
  target_audience text,
  rules           text,
  prizes          text,
  status          public.campaign_status not null default 'rascunho',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index campaigns_status_idx on public.campaigns (status);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.campaign_levels (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name        text not null,
  description text,
  difficulty  public.campaign_level_difficulty not null default 'facil',
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);
create index campaign_levels_campaign_idx on public.campaign_levels (campaign_id);

create table public.campaign_participants (
  id               uuid primary key default gen_random_uuid(),
  campaign_id      uuid not null references public.campaigns (id) on delete cascade,
  full_name        text not null,
  age              int,
  phone            text,
  father_name      text,
  mother_name      text,
  guardian_name    text,
  school           text,
  city             text,
  current_level    int not null default 0,
  status           public.campaign_participant_status not null default 'inscrito',
  eligible_for_draw boolean not null default false,
  is_winner        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index campaign_participants_campaign_idx on public.campaign_participants (campaign_id);

create trigger campaign_participants_set_updated_at
  before update on public.campaign_participants
  for each row execute function public.set_updated_at();

create table public.campaign_progress (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.campaign_participants (id) on delete cascade,
  level_id       uuid not null references public.campaign_levels (id) on delete cascade,
  completed_at   timestamptz not null default now(),
  score          numeric(8, 2),
  notes          text,
  unique (participant_id, level_id)
);
create index campaign_progress_participant_idx on public.campaign_progress (participant_id);

-- -----------------------------------------------------------------------------
-- 4. RLS — tudo gated por campaigns.manage.
-- -----------------------------------------------------------------------------
alter table public.campaigns enable row level security;
alter table public.campaign_levels enable row level security;
alter table public.campaign_participants enable row level security;
alter table public.campaign_progress enable row level security;

create policy "campaigns_all" on public.campaigns
  for all to authenticated
  using (public.has_permission('campaigns.manage'))
  with check (public.has_permission('campaigns.manage'));

create policy "campaign_levels_all" on public.campaign_levels
  for all to authenticated
  using (public.has_permission('campaigns.manage'))
  with check (public.has_permission('campaigns.manage'));

create policy "campaign_participants_all" on public.campaign_participants
  for all to authenticated
  using (public.has_permission('campaigns.manage'))
  with check (public.has_permission('campaigns.manage'));

create policy "campaign_progress_all" on public.campaign_progress
  for all to authenticated
  using (public.has_permission('campaigns.manage'))
  with check (public.has_permission('campaigns.manage'));
