-- =============================================================================
-- Migration: Comercial — permissão de leitura de alunos
-- =============================================================================
-- A página /dashboard/alunos exige students.read. O comercial tinha apenas
-- students.manage; sem students.read a lista dava "Acesso negado".
-- =============================================================================

insert into public.role_permissions (role_key, permission_key) values
  ('comercial', 'students.read')
on conflict do nothing;
