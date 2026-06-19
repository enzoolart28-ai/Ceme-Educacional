-- =============================================================================
-- Migration: Permissoes do Perfil Comercial
-- Sistema CME Educacional
-- =============================================================================
-- O perfil comercial opera CRM/Eventos e visualiza relatorios comerciais.
-- Nao entra em is_staff(), para nao ganhar leitura ampla de usuarios/alunos.
-- =============================================================================

insert into public.roles (key, label, description) values
  ('comercial', 'Comercial', 'Atendimento comercial, leads, eventos e conversao em matricula.')
  on conflict (key) do update set
    label = excluded.label,
    description = excluded.description;

insert into public.role_permissions (role_key, permission_key) values
  ('comercial', 'profile.self'),
  ('comercial', 'leads.manage'),
  ('comercial', 'reports.read')
  on conflict do nothing;
