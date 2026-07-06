-- =============================================================================
-- Migration: Professor ganha acesso ao Comercial (CRM) / leads
-- =============================================================================
-- Concede leads.manage ao professor, para que ele veja e gerencie leads no CRM
-- (a página /dashboard/crm e a RLS de leads exigem leads.manage).
-- =============================================================================

insert into public.role_permissions (role_key, permission_key) values
  ('professor', 'leads.manage')
on conflict do nothing;
