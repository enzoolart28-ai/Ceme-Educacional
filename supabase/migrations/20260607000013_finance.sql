-- =============================================================================
-- Migration: Módulo Financeiro
-- Sistema CME Educacional
-- =============================================================================
-- Entidades: financial_plans, invoices, payments e financial_logs.
-- Regras principais:
--   - financeiro, direção e administrador gerenciam;
--   - secretaria visualiza status financeiro básico;
--   - aluno vê as próprias cobranças;
--   - responsável financeiro vê cobranças dos alunos vinculados;
--   - pagamento registrado gera log;
--   - exclusão de pagamento apenas para administrador.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.invoice_status as enum (
  'paid',
  'open',
  'overdue',
  'partial',
  'cancelled',
  'renegotiated'
);

create type public.payment_method as enum (
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'bank_slip',
  'transfer',
  'other'
);

-- -----------------------------------------------------------------------------
-- 2. Permissões
-- -----------------------------------------------------------------------------
insert into public.role_permissions (role_key, permission_key) values
  ('diretor', 'finance.manage'),
  ('secretaria', 'finance.read')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Tabelas
-- -----------------------------------------------------------------------------
create table public.financial_plans (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  course_id              uuid references public.courses (id) on delete set null,
  total_value            numeric(12, 2) not null default 0,
  installments           int not null default 1,
  due_day                int not null default 10,
  discount_value         numeric(12, 2) not null default 0,
  scholarship_percentage numeric(5, 2) not null default 0,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint financial_plans_total_value_check check (total_value >= 0),
  constraint financial_plans_installments_check check (installments > 0),
  constraint financial_plans_due_day_check check (due_day between 1 and 28),
  constraint financial_plans_discount_value_check check (discount_value >= 0),
  constraint financial_plans_scholarship_check check (scholarship_percentage between 0 and 100)
);

create index financial_plans_course_idx on public.financial_plans (course_id);

create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students (id) on delete cascade,
  plan_id        uuid references public.financial_plans (id) on delete set null,
  enrollment_id  uuid references public.class_students (id) on delete set null,
  course_id      uuid references public.courses (id) on delete set null,
  class_id       uuid references public.classes (id) on delete set null,
  original_value numeric(12, 2) not null default 0,
  discount_value numeric(12, 2) not null default 0,
  fine_value     numeric(12, 2) not null default 0,
  interest_value numeric(12, 2) not null default 0,
  final_value    numeric(12, 2) generated always as (
    greatest(original_value - discount_value + fine_value + interest_value, 0)
  ) stored,
  due_date       date not null,
  paid_at        timestamptz,
  status         public.invoice_status not null default 'open',
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint invoices_original_value_check check (original_value >= 0),
  constraint invoices_discount_value_check check (discount_value >= 0),
  constraint invoices_fine_value_check check (fine_value >= 0),
  constraint invoices_interest_value_check check (interest_value >= 0)
);

create index invoices_student_idx on public.invoices (student_id);
create index invoices_plan_idx on public.invoices (plan_id);
create index invoices_enrollment_idx on public.invoices (enrollment_id);
create index invoices_course_idx on public.invoices (course_id);
create index invoices_class_idx on public.invoices (class_id);
create index invoices_status_idx on public.invoices (status);
create index invoices_due_date_idx on public.invoices (due_date);

create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  invoice_id     uuid not null references public.invoices (id) on delete cascade,
  amount         numeric(12, 2) not null,
  payment_method public.payment_method not null default 'pix',
  paid_at        timestamptz not null default now(),
  received_by    uuid references public.profiles (id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now(),
  constraint payments_amount_check check (amount > 0)
);

create index payments_invoice_idx on public.payments (invoice_id);
create index payments_paid_at_idx on public.payments (paid_at);
create index payments_received_by_idx on public.payments (received_by);

create table public.financial_logs (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid references public.invoices (id) on delete cascade,
  payment_id  uuid references public.payments (id) on delete set null,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index financial_logs_invoice_idx on public.financial_logs (invoice_id);
create index financial_logs_payment_idx on public.financial_logs (payment_id);
create index financial_logs_created_at_idx on public.financial_logs (created_at);

-- -----------------------------------------------------------------------------
-- 4. Triggers e helpers
-- -----------------------------------------------------------------------------
create trigger financial_plans_set_updated_at
  before update on public.financial_plans
  for each row execute function public.set_updated_at();

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create or replace function public.financial_invoice_paid_amount(p_invoice uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)
    from public.payments
   where invoice_id = p_invoice;
$$;

create or replace function public.refresh_overdue_invoices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invoices
     set status = 'overdue'
   where status = 'open'
     and due_date < current_date;
end;
$$;

create or replace function public.sync_invoice_payment_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_final numeric;
  v_status public.invoice_status;
  v_paid numeric;
  v_paid_at timestamptz;
begin
  v_invoice_id := coalesce(new.invoice_id, old.invoice_id);

  select final_value, status
    into v_final, v_status
    from public.invoices
   where id = v_invoice_id;

  if v_invoice_id is null or v_status in ('cancelled', 'renegotiated') then
    return coalesce(new, old);
  end if;

  select coalesce(sum(amount), 0), max(paid_at)
    into v_paid, v_paid_at
    from public.payments
   where invoice_id = v_invoice_id;

  update public.invoices
     set status = case
       when v_paid >= v_final and v_final > 0 then 'paid'::public.invoice_status
       when v_paid > 0 then 'partial'::public.invoice_status
       when due_date < current_date then 'overdue'::public.invoice_status
       else 'open'::public.invoice_status
     end,
     paid_at = case when v_paid >= v_final and v_final > 0 then v_paid_at else null end
   where id = v_invoice_id;

  return coalesce(new, old);
end;
$$;

create trigger payments_sync_invoice_state
  after insert or update or delete on public.payments
  for each row execute function public.sync_invoice_payment_state();

create or replace function public.log_registered_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.financial_logs (
    invoice_id,
    payment_id,
    actor_id,
    action,
    metadata
  ) values (
    new.invoice_id,
    new.id,
    new.received_by,
    'payment.registered',
    jsonb_build_object(
      'amount', new.amount,
      'payment_method', new.payment_method,
      'paid_at', new.paid_at
    )
  );
  return new;
end;
$$;

create trigger payments_log_insert
  after insert on public.payments
  for each row execute function public.log_registered_payment();

create or replace function public.can_view_financial_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_user_role() in ('admin', 'diretor', 'financeiro', 'secretaria')
    or exists (
      select 1
        from public.students s
       where s.id = p_student_id
         and s.profile_id = public.current_profile_id()
    )
    or exists (
      select 1
        from public.student_guardians sg
        join public.guardians g on g.id = sg.guardian_id
       where sg.student_id = p_student_id
         and sg.is_financial_responsible = true
         and g.profile_id = public.current_profile_id()
    );
$$;

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------
alter table public.financial_plans enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.financial_logs enable row level security;

create policy "financial_plans_select" on public.financial_plans
  for select to authenticated
  using (public.current_user_role() in ('admin', 'diretor', 'financeiro', 'secretaria'));

create policy "financial_plans_write" on public.financial_plans
  for all to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

create policy "invoices_select" on public.invoices
  for select to authenticated
  using (public.can_view_financial_student(student_id));

create policy "invoices_insert" on public.invoices
  for insert to authenticated
  with check (public.has_permission('finance.manage'));

create policy "invoices_update" on public.invoices
  for update to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

create policy "invoices_delete" on public.invoices
  for delete to authenticated
  using (public.is_admin());

create policy "payments_select" on public.payments
  for select to authenticated
  using (
    exists (
      select 1
        from public.invoices i
       where i.id = payments.invoice_id
         and public.can_view_financial_student(i.student_id)
    )
  );

create policy "payments_insert" on public.payments
  for insert to authenticated
  with check (public.has_permission('finance.manage'));

create policy "payments_update" on public.payments
  for update to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

create policy "payments_delete_admin" on public.payments
  for delete to authenticated
  using (public.is_admin());

create policy "financial_logs_select" on public.financial_logs
  for select to authenticated
  using (public.current_user_role() in ('admin', 'diretor', 'financeiro'));

create policy "financial_logs_insert" on public.financial_logs
  for insert to authenticated
  with check (public.has_permission('finance.manage'));
