-- Permite ao setor financeiro acessar e operar o modulo Comercial (CRM).

insert into public.role_permissions (role_key, permission_key) values
  ('financeiro', 'leads.manage')
on conflict do nothing;
