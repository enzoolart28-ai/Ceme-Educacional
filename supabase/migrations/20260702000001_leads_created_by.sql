-- =============================================================================
-- Migration: Leads — registrar quem captou (para filtro por usuário)
-- =============================================================================
-- created_by (id do perfil) permite filtrar leads por usuário; created_by_name
-- guarda o nome de forma denormalizada, para exibir mesmo aos perfis do CRM que
-- não têm leitura ampla de profiles (comercial/gestor não são is_staff()).
-- =============================================================================

alter table public.leads
  add column if not exists created_by uuid references public.profiles (id) on delete set null,
  add column if not exists created_by_name text;

create index if not exists leads_created_by_idx on public.leads (created_by);
