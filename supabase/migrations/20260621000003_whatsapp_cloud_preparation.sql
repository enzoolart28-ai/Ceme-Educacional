-- Base da integracao com a API oficial WhatsApp Cloud.

create type public.whatsapp_opt_in_status as enum ('pending', 'opted_in', 'opted_out');
create type public.whatsapp_message_direction as enum ('inbound', 'outbound');
create type public.whatsapp_message_status as enum (
  'queued', 'sent', 'delivered', 'read', 'failed', 'received'
);
create type public.whatsapp_outbox_status as enum (
  'pending', 'processing', 'sent', 'failed', 'cancelled'
);
create type public.whatsapp_trigger_type as enum (
  'lead_no_response', 'invoice_due', 'invoice_overdue', 'manual'
);

insert into public.permissions (key, label, description) values
  ('whatsapp.manage', 'Gerenciar WhatsApp', 'Configurar envios, contatos e follow-ups do WhatsApp.')
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'whatsapp.manage'),
  ('diretor', 'whatsapp.manage'),
  ('gestor', 'whatsapp.manage'),
  ('comercial', 'whatsapp.manage'),
  ('secretaria', 'whatsapp.manage'),
  ('financeiro', 'whatsapp.manage')
on conflict do nothing;

create table public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  display_name text,
  profile_id uuid references public.profiles(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  guardian_id uuid references public.guardians(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  opt_in_status public.whatsapp_opt_in_status not null default 'pending',
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index whatsapp_contacts_student_idx on public.whatsapp_contacts(student_id);
create index whatsapp_contacts_guardian_idx on public.whatsapp_contacts(guardian_id);
create index whatsapp_contacts_lead_idx on public.whatsapp_contacts(lead_id);

create table public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  meta_template_id text unique,
  name text not null,
  language text not null default 'pt_BR',
  category text,
  status text not null default 'pending',
  components jsonb not null default '[]'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, language)
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.whatsapp_contacts(id) on delete cascade,
  direction public.whatsapp_message_direction not null,
  status public.whatsapp_message_status not null,
  meta_message_id text unique,
  template_name text,
  body text,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index whatsapp_messages_contact_idx on public.whatsapp_messages(contact_id, created_at desc);
create index whatsapp_messages_status_idx on public.whatsapp_messages(status, created_at desc);

create table public.whatsapp_follow_up_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type public.whatsapp_trigger_type not null,
  delay_minutes integer not null default 0 check (delay_minutes >= 0),
  template_name text not null,
  template_language text not null default 'pt_BR',
  enabled boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.whatsapp_outbox (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.whatsapp_contacts(id) on delete cascade,
  follow_up_rule_id uuid references public.whatsapp_follow_up_rules(id) on delete set null,
  template_name text not null,
  template_language text not null default 'pt_BR',
  template_components jsonb not null default '[]'::jsonb,
  scheduled_for timestamptz not null,
  status public.whatsapp_outbox_status not null default 'pending',
  attempts integer not null default 0,
  idempotency_key text not null unique,
  source_type text,
  source_id uuid,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index whatsapp_outbox_pending_idx
  on public.whatsapp_outbox(scheduled_for)
  where status = 'pending';

create table public.whatsapp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

create trigger whatsapp_contacts_set_updated_at before update on public.whatsapp_contacts
  for each row execute function public.set_updated_at();
create trigger whatsapp_templates_set_updated_at before update on public.whatsapp_templates
  for each row execute function public.set_updated_at();
create trigger whatsapp_follow_up_rules_set_updated_at before update on public.whatsapp_follow_up_rules
  for each row execute function public.set_updated_at();
create trigger whatsapp_outbox_set_updated_at before update on public.whatsapp_outbox
  for each row execute function public.set_updated_at();

alter table public.whatsapp_contacts enable row level security;
alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.whatsapp_follow_up_rules enable row level security;
alter table public.whatsapp_outbox enable row level security;
alter table public.whatsapp_webhook_events enable row level security;

create policy "whatsapp_contacts_manage" on public.whatsapp_contacts for all to authenticated
  using (public.has_permission('whatsapp.manage'))
  with check (public.has_permission('whatsapp.manage'));
create policy "whatsapp_templates_manage" on public.whatsapp_templates for all to authenticated
  using (public.has_permission('whatsapp.manage'))
  with check (public.has_permission('whatsapp.manage'));
create policy "whatsapp_messages_manage" on public.whatsapp_messages for all to authenticated
  using (public.has_permission('whatsapp.manage'))
  with check (public.has_permission('whatsapp.manage'));
create policy "whatsapp_rules_manage" on public.whatsapp_follow_up_rules for all to authenticated
  using (public.has_permission('whatsapp.manage'))
  with check (public.has_permission('whatsapp.manage'));
create policy "whatsapp_outbox_manage" on public.whatsapp_outbox for all to authenticated
  using (public.has_permission('whatsapp.manage'))
  with check (public.has_permission('whatsapp.manage'));
create policy "whatsapp_webhooks_admin_read" on public.whatsapp_webhook_events for select to authenticated
  using (public.is_admin());
