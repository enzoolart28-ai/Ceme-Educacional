-- =============================================================================
-- Migration: Fundação de autenticação e perfis
-- Sistema CME Educacional
-- =============================================================================
-- Base de identidade do sistema:
--   * enums user_role (8 perfis) e user_status
--   * tabela public.profiles (id próprio + user_id -> auth.users)
--   * helpers SECURITY DEFINER (papel/role do usuário) sem recursão de RLS
--   * trigger que cria o profile no signup
--   * trigger de updated_at e guarda de colunas privilegiadas
--   * função record_last_access() para registrar último acesso
--   * políticas RLS por perfil
-- O catálogo de roles/permissions fica na migration seguinte.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum (
  'admin',
  'diretor',
  'coordenacao',
  'secretaria',
  'financeiro',
  'professor',
  'aluno',
  'responsavel'
);

create type public.user_status as enum (
  'active',    -- acesso liberado
  'inactive',  -- desativado pela administração
  'suspended', -- bloqueado temporariamente
  'pending'    -- aguardando ativação
);

-- -----------------------------------------------------------------------------
-- 2. Tabela de perfis (extensão de auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users (id) on delete cascade,
  full_name      text not null default '',
  email          text not null,
  phone          text,
  role           public.user_role   not null default 'aluno',
  status         public.user_status not null default 'active',
  last_access_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuário, vinculado 1:1 com auth.users via user_id.';
comment on column public.profiles.role is 'Papel do usuário, base do controle de permissões (RBAC).';
comment on column public.profiles.status is 'Situação da conta; somente "active" pode usar o sistema.';
comment on column public.profiles.last_access_at is 'Registro do último login bem-sucedido.';

create index profiles_user_id_idx on public.profiles (user_id);
create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);

-- -----------------------------------------------------------------------------
-- 3. Helpers: papel do usuário atual (SECURITY DEFINER evita recursão de RLS)
-- -----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid();
$$;

comment on function public.current_user_role() is
  'Papel do usuário autenticado. SECURITY DEFINER para uso seguro em políticas RLS sem recursão.';

create or replace function public.current_user_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

-- Conjunto de papéis com visão administrativa sobre usuários.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in (
    'admin', 'diretor', 'coordenacao', 'secretaria'
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. Trigger: criar profile automaticamente no signup
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'aluno')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 5. Trigger: manter updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Registro de último acesso (chamado pelo app após login)
-- -----------------------------------------------------------------------------
create or replace function public.record_last_access()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.profiles
     set last_access_at = now()
   where user_id = auth.uid();
$$;

comment on function public.record_last_access() is
  'Atualiza last_access_at do usuário autenticado. Chamada via RPC após login.';

-- -----------------------------------------------------------------------------
-- 7. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Leitura: o próprio usuário sempre vê seu perfil; staff vê todos.
create policy "profiles_select_self_or_staff"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- Atualização do próprio perfil (campos pessoais). A troca de role/status é
-- barrada por trigger abaixo, para que o usuário comum não se promova.
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Staff administrativo pode atualizar qualquer perfil.
create policy "profiles_update_staff"
  on public.profiles for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Apenas admin pode inserir perfis manualmente (o signup usa o trigger
-- SECURITY DEFINER, que ignora RLS).
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin());

-- Apenas admin pode remover perfis.
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. Guarda: impedir auto-promoção de role / mudança de status por usuário comum
-- -----------------------------------------------------------------------------
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Contexto confiável de servidor (seed, service_role, jobs): sem sessão de
  -- usuário final (auth.uid() nulo). RLS já controla quem chega aqui.
  if auth.uid() is null then
    return new;
  end if;

  -- Staff/admin podem alterar role e status livremente.
  if public.is_staff() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Você não tem permissão para alterar o papel do usuário.';
  end if;

  if new.status is distinct from old.status then
    raise exception 'Você não tem permissão para alterar o status da conta.';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();
