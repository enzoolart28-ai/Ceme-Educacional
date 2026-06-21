-- =============================================================================
-- Migration: Integracao Asaas
-- Sistema CME Educacional
-- =============================================================================

create table public.asaas_customers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  asaas_customer_id text not null,
  environment text not null check (environment in ('sandbox', 'production')),
  name text not null,
  cpf_cnpj text not null,
  raw_response jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, environment),
  unique (asaas_customer_id, environment)
);

create table public.asaas_charges (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  asaas_customer_id text not null,
  asaas_payment_id text not null,
  environment text not null check (environment in ('sandbox', 'production')),
  billing_type text not null,
  status text not null,
  value numeric(12, 2) not null,
  due_date date not null,
  external_reference text not null,
  invoice_url text,
  bank_slip_url text,
  pix_payload text,
  pix_encoded_image text,
  pix_expiration_at timestamptz,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invoice_id, environment),
  unique (asaas_payment_id, environment)
);

create index asaas_charges_status_idx on public.asaas_charges (status);
create index asaas_charges_external_reference_idx on public.asaas_charges (external_reference);

create table public.asaas_webhook_events (
  id uuid primary key default gen_random_uuid(),
  asaas_event_id text not null unique,
  event_type text not null,
  asaas_payment_id text,
  payload jsonb not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

create index asaas_webhook_events_payment_idx on public.asaas_webhook_events (asaas_payment_id);
create index asaas_webhook_events_processed_idx on public.asaas_webhook_events (processed_at);

alter table public.payments
  add column if not exists payment_provider text,
  add column if not exists provider_payment_id text;

create unique index if not exists payments_provider_payment_unique_idx
  on public.payments (payment_provider, provider_payment_id)
  where payment_provider is not null and provider_payment_id is not null;

create trigger asaas_customers_set_updated_at
  before update on public.asaas_customers
  for each row execute function public.set_updated_at();

create trigger asaas_charges_set_updated_at
  before update on public.asaas_charges
  for each row execute function public.set_updated_at();

alter table public.asaas_customers enable row level security;
alter table public.asaas_charges enable row level security;
alter table public.asaas_webhook_events enable row level security;

create policy "asaas_customers_read" on public.asaas_customers
  for select to authenticated
  using (public.has_permission('finance.read') or public.has_permission('finance.manage'));
create policy "asaas_customers_write" on public.asaas_customers
  for all to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

create policy "asaas_charges_read" on public.asaas_charges
  for select to authenticated
  using (
    public.has_permission('finance.read')
    or public.has_permission('finance.manage')
    or exists (
      select 1 from public.invoices i
       where i.id = invoice_id and public.can_view_financial_student(i.student_id)
    )
  );
create policy "asaas_charges_write" on public.asaas_charges
  for all to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

create policy "asaas_webhook_events_read" on public.asaas_webhook_events
  for select to authenticated using (public.is_admin());

comment on table public.asaas_customers is 'Vinculo entre aluno CME e cliente Asaas.';
comment on table public.asaas_charges is 'Vinculo entre mensalidade CME e cobranca Asaas.';
comment on table public.asaas_webhook_events is 'Eventos recebidos do Asaas para processamento idempotente.';
