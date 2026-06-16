-- =============================================================================
-- Migration: Gestao gerencial, caixa e solicitacoes financeiras
-- Sistema CME Educacional
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Catalogo de perfil e permissoes
-- -----------------------------------------------------------------------------
insert into public.roles (key, label, description) values
  ('gestor', 'Gestor', 'Acompanhamento gerencial, fiscalizacao, analise e aprovacoes.')
on conflict (key) do update
  set label = excluded.label,
      description = excluded.description;

insert into public.permissions (key, label, description) values
  ('management.read', 'Ver gestao', 'Visualizar dashboard gerencial e indicadores consolidados.'),
  ('management.review', 'Analisar setores', 'Registrar analises, observacoes e verificacoes gerenciais.'),
  ('management.goals.manage', 'Gerenciar metas', 'Criar e acompanhar metas por setor.'),
  ('cash.read', 'Ver caixa', 'Visualizar caixas, sessoes, movimentacoes e fluxo de caixa.'),
  ('cash.manage', 'Gerenciar caixa', 'Abrir caixa, movimentar e fechar sessoes de caixa.'),
  ('cash.review', 'Conferir caixa', 'Aprovar, reprovar e solicitar nova conferencia de fechamento.'),
  ('financial_requests.create', 'Criar solicitacoes financeiras', 'Criar e acompanhar solicitacoes proprias de saida financeira.'),
  ('financial_requests.read', 'Ver solicitacoes financeiras', 'Visualizar solicitacoes financeiras conforme perfil.'),
  ('financial_requests.approve', 'Aprovar solicitacoes financeiras', 'Aprovar, recusar e devolver solicitacoes financeiras.'),
  ('financial_requests.pay', 'Pagar solicitacoes financeiras', 'Registrar pagamento de solicitacoes aprovadas.'),
  ('audit.read', 'Ver auditoria', 'Visualizar logs e historicos de acoes importantes.')
on conflict (key) do update
  set label = excluded.label,
      description = excluded.description;

insert into public.role_permissions (role_key, permission_key) values
  ('gestor', 'profile.self'),
  ('gestor', 'users.read'),
  ('gestor', 'reports.read'),
  ('gestor', 'management.read'),
  ('gestor', 'management.review'),
  ('gestor', 'management.goals.manage'),
  ('gestor', 'cash.read'),
  ('gestor', 'cash.review'),
  ('gestor', 'financial_requests.read'),
  ('gestor', 'financial_requests.approve'),
  ('gestor', 'alerts.manage'),
  ('gestor', 'audit.read'),
  ('gestor', 'finance.read'),
  ('gestor', 'academic.read'),
  ('gestor', 'classes.read'),
  ('gestor', 'grades.read'),
  ('gestor', 'teachers.read'),
  ('gestor', 'students.read'),
  ('gestor', 'documents.read'),
  ('gestor', 'leads.manage'),
  ('financeiro', 'cash.read'),
  ('financeiro', 'cash.manage'),
  ('financeiro', 'financial_requests.read'),
  ('financeiro', 'financial_requests.pay'),
  ('diretor', 'management.read'),
  ('diretor', 'management.review'),
  ('diretor', 'cash.read'),
  ('diretor', 'cash.review'),
  ('diretor', 'financial_requests.read'),
  ('diretor', 'financial_requests.approve'),
  ('diretor', 'audit.read'),
  ('coordenacao', 'financial_requests.create'),
  ('secretaria', 'financial_requests.create'),
  ('financeiro', 'financial_requests.create'),
  ('professor', 'financial_requests.create')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 2. Enums
-- -----------------------------------------------------------------------------
create type public.department_status as enum ('active', 'inactive');
create type public.goal_status as enum (
  'not_started',
  'in_progress',
  'on_track',
  'late',
  'completed',
  'cancelled'
);
create type public.manager_review_status as enum (
  'on_track',
  'attention',
  'late',
  'critical',
  'completed'
);
create type public.manager_review_type as enum (
  'department',
  'goal',
  'cash_session',
  'financial_request',
  'indicator',
  'other'
);
create type public.cash_register_status as enum ('active', 'inactive');
create type public.cash_session_status as enum (
  'open',
  'closed',
  'under_review',
  'with_difference',
  'approved',
  'rejected'
);
create type public.cash_movement_type as enum (
  'entry',
  'exit',
  'reinforcement',
  'withdrawal',
  'reversal',
  'adjustment'
);
create type public.cash_movement_status as enum ('pending', 'completed', 'cancelled', 'reversed');
create type public.financial_request_priority as enum ('baixa', 'media', 'alta', 'urgente');
create type public.financial_request_status as enum (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'partially_approved',
  'rejected',
  'needs_information',
  'paid',
  'cancelled'
);
create type public.manager_decision as enum (
  'approved',
  'partially_approved',
  'rejected',
  'needs_information',
  'returned_for_correction',
  'forwarded_to_direction'
);

-- -----------------------------------------------------------------------------
-- 3. Tabelas gerenciais
-- -----------------------------------------------------------------------------
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  manager_id uuid references public.profiles (id) on delete set null,
  status public.department_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  department_id uuid references public.departments (id) on delete set null,
  budget_limit numeric(12, 2) not null default 0,
  status public.department_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cost_centers_budget_check check (budget_limit >= 0)
);
create index cost_centers_department_idx on public.cost_centers (department_id);

create table public.department_goals (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  title text not null,
  description text,
  responsible_user_id uuid references public.profiles (id) on delete set null,
  start_date date,
  end_date date,
  target_value numeric(12, 2),
  achieved_value numeric(12, 2) not null default 0,
  progress_percentage numeric(5, 2) not null default 0,
  status public.goal_status not null default 'not_started',
  manager_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint department_goals_progress_check check (progress_percentage between 0 and 100)
);
create index department_goals_department_idx on public.department_goals (department_id);
create index department_goals_responsible_idx on public.department_goals (responsible_user_id);

create table public.manager_reviews (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid references public.profiles (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  review_type public.manager_review_type not null default 'department',
  reference_id uuid,
  status public.manager_review_status not null default 'attention',
  notes text,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index manager_reviews_manager_idx on public.manager_reviews (manager_id);
create index manager_reviews_department_idx on public.manager_reviews (department_id);
create index manager_reviews_reference_idx on public.manager_reviews (review_type, reference_id);

-- -----------------------------------------------------------------------------
-- 4. Caixa e fluxo
-- -----------------------------------------------------------------------------
create table public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit_id uuid references public.units (id) on delete set null,
  status public.cash_register_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, unit_id)
);
create index cash_registers_unit_idx on public.cash_registers (unit_id);

create table public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers (id) on delete restrict,
  unit_id uuid references public.units (id) on delete set null,
  opened_by uuid not null references public.profiles (id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_balance numeric(12, 2) not null default 0,
  closed_by uuid references public.profiles (id) on delete set null,
  closed_at timestamptz,
  expected_closing_balance numeric(12, 2),
  informed_closing_balance numeric(12, 2),
  difference numeric(12, 2),
  difference_reason text,
  status public.cash_session_status not null default 'open',
  manager_reviewed_by uuid references public.profiles (id) on delete set null,
  manager_reviewed_at timestamptz,
  manager_review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_sessions_opening_balance_check check (opening_balance >= 0),
  constraint cash_sessions_difference_reason_check check (
    difference is null or difference = 0 or nullif(btrim(difference_reason), '') is not null
  )
);
create index cash_sessions_register_idx on public.cash_sessions (cash_register_id);
create index cash_sessions_unit_idx on public.cash_sessions (unit_id);
create index cash_sessions_status_idx on public.cash_sessions (status);
create unique index cash_sessions_one_open_register_idx
  on public.cash_sessions (cash_register_id)
  where status = 'open';

create table public.financial_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  requested_amount numeric(12, 2) not null,
  approved_amount numeric(12, 2),
  request_date date not null default current_date,
  required_date date,
  requester_id uuid not null references public.profiles (id) on delete restrict,
  department_id uuid references public.departments (id) on delete set null,
  unit_id uuid references public.units (id) on delete set null,
  cost_center_id uuid references public.cost_centers (id) on delete set null,
  expense_category text not null default 'outro',
  beneficiary_name text,
  beneficiary_document text,
  desired_payment_method public.payment_method not null default 'pix',
  justification text,
  priority public.financial_request_priority not null default 'media',
  status public.financial_request_status not null default 'draft',
  attachment_url text,
  manager_id uuid references public.profiles (id) on delete set null,
  manager_decision public.manager_decision,
  manager_reason text,
  manager_decision_at timestamptz,
  paid_amount numeric(12, 2),
  paid_at timestamptz,
  paid_by uuid references public.profiles (id) on delete set null,
  payment_proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_requests_requested_amount_check check (requested_amount > 0),
  constraint financial_requests_approved_amount_check check (approved_amount is null or approved_amount >= 0),
  constraint financial_requests_paid_amount_check check (paid_amount is null or paid_amount >= 0),
  constraint financial_requests_manager_reason_check check (
    manager_decision is null or nullif(btrim(manager_reason), '') is not null
  ),
  constraint financial_requests_payment_proof_check check (
    status <> 'paid' or nullif(btrim(coalesce(payment_proof_url, '')), '') is not null
  )
);
create index financial_requests_requester_idx on public.financial_requests (requester_id);
create index financial_requests_department_idx on public.financial_requests (department_id);
create index financial_requests_status_idx on public.financial_requests (status);
create index financial_requests_priority_idx on public.financial_requests (priority);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions (id) on delete restrict,
  unit_id uuid references public.units (id) on delete set null,
  movement_type public.cash_movement_type not null,
  category text not null default 'outro',
  description text,
  amount numeric(12, 2) not null,
  payment_method public.payment_method not null default 'cash',
  cost_center_id uuid references public.cost_centers (id) on delete set null,
  department_id uuid references public.departments (id) on delete set null,
  financial_request_id uuid references public.financial_requests (id) on delete set null,
  attachment_url text,
  status public.cash_movement_status not null default 'completed',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_movements_amount_check check (amount > 0)
);
create index cash_movements_session_idx on public.cash_movements (cash_session_id);
create index cash_movements_unit_idx on public.cash_movements (unit_id);
create index cash_movements_request_idx on public.cash_movements (financial_request_id);
create index cash_movements_status_idx on public.cash_movements (status);
create index cash_movements_created_at_idx on public.cash_movements (created_at);

create table public.financial_request_history (
  id uuid primary key default gen_random_uuid(),
  financial_request_id uuid not null references public.financial_requests (id) on delete cascade,
  action text not null,
  previous_status public.financial_request_status,
  new_status public.financial_request_status,
  user_id uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index fr_history_request_idx on public.financial_request_history (financial_request_id);

create table public.management_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index management_audit_logs_entity_idx on public.management_audit_logs (entity_type, entity_id);
create index management_audit_logs_created_at_idx on public.management_audit_logs (created_at);

-- -----------------------------------------------------------------------------
-- 5. Triggers updated_at
-- -----------------------------------------------------------------------------
create trigger departments_set_updated_at before update on public.departments
  for each row execute function public.set_updated_at();
create trigger cost_centers_set_updated_at before update on public.cost_centers
  for each row execute function public.set_updated_at();
create trigger department_goals_set_updated_at before update on public.department_goals
  for each row execute function public.set_updated_at();
create trigger manager_reviews_set_updated_at before update on public.manager_reviews
  for each row execute function public.set_updated_at();
create trigger cash_registers_set_updated_at before update on public.cash_registers
  for each row execute function public.set_updated_at();
create trigger cash_sessions_set_updated_at before update on public.cash_sessions
  for each row execute function public.set_updated_at();
create trigger cash_movements_set_updated_at before update on public.cash_movements
  for each row execute function public.set_updated_at();
create trigger financial_requests_set_updated_at before update on public.financial_requests
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Helpers e regras de negocio
-- -----------------------------------------------------------------------------
create or replace function public.is_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'gestor';
$$;

create or replace function public.can_view_management()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'diretor', 'gestor');
$$;

create or replace function public.can_read_cash()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'diretor', 'gestor', 'financeiro');
$$;

create or replace function public.can_review_cash()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'diretor', 'gestor');
$$;

create or replace function public.cash_session_expected_balance(p_session uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select cs.opening_balance
       + coalesce(sum(case
           when cm.status <> 'completed' then 0
           when cm.movement_type in ('entry', 'reinforcement') then cm.amount
           when cm.movement_type in ('exit', 'withdrawal') then -cm.amount
           when cm.movement_type = 'adjustment' then cm.amount
           when cm.movement_type = 'reversal' then cm.amount
           else 0
         end), 0)
    from public.cash_sessions cs
    left join public.cash_movements cm on cm.cash_session_id = cs.id
   where cs.id = p_session
   group by cs.id, cs.opening_balance;
$$;

create or replace function public.guard_cash_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.cash_sessions;
  v_request public.financial_requests;
begin
  select * into v_session from public.cash_sessions where id = new.cash_session_id;
  if v_session.id is null then
    raise exception 'CAIXA_NAO_ENCONTRADO';
  end if;
  if v_session.status <> 'open' then
    raise exception 'NAO_PERMITIDO_MOVIMENTAR_CAIXA_FECHADO';
  end if;
  if not (public.has_permission('cash.manage') or public.is_admin()) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if new.created_by is distinct from public.current_profile_id() and auth.uid() is not null then
    raise exception 'USUARIO_RESPONSAVEL_INVALIDO';
  end if;

  if new.movement_type = 'exit' and new.financial_request_id is null then
    raise exception 'Saida de dinheiro exige solicitacao financeira aprovada.';
  end if;

  if new.movement_type in ('exit', 'withdrawal') and new.financial_request_id is not null then
    select * into v_request from public.financial_requests where id = new.financial_request_id;
    if v_request.id is null then
      raise exception 'SOLICITACAO_NAO_ENCONTRADA';
    end if;
    if v_request.status not in ('approved', 'partially_approved') then
      raise exception 'SOLICITACAO_NAO_APROVADA';
    end if;
    if new.amount > coalesce(v_request.approved_amount, 0) then
      raise exception 'VALOR_MAIOR_QUE_APROVADO';
    end if;
  end if;

  return new;
end;
$$;

create trigger cash_movements_guard_insert
  before insert on public.cash_movements
  for each row execute function public.guard_cash_movement();

create or replace function public.prevent_cash_movement_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Movimentacoes financeiras nao podem ser excluidas. Use cancelamento, estorno ou reversao.';
end;
$$;

create trigger cash_movements_no_delete
  before delete on public.cash_movements
  for each row execute function public.prevent_cash_movement_delete();

create or replace function public.log_cash_movement_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.management_audit_logs (user_id, action, entity_type, entity_id, new_data)
  values (new.created_by, 'cash_movement.created', 'cash_movements', new.id, to_jsonb(new));
  insert into public.financial_logs (actor_id, action, metadata)
  values (new.created_by, 'cash_movement.created', to_jsonb(new));
  return new;
end;
$$;

create trigger cash_movements_log_insert
  after insert on public.cash_movements
  for each row execute function public.log_cash_movement_insert();

create or replace function public.log_cash_session_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.management_audit_logs (user_id, action, entity_type, entity_id, new_data)
    values (new.opened_by, 'cash_session.opened', 'cash_sessions', new.id, to_jsonb(new));
    return new;
  end if;

  insert into public.management_audit_logs (user_id, action, entity_type, entity_id, previous_data, new_data)
  values (
    coalesce(new.closed_by, new.manager_reviewed_by, public.current_profile_id()),
    case
      when old.status = 'open' and new.status <> old.status then 'cash_session.closed'
      when new.manager_reviewed_at is not null and old.manager_reviewed_at is distinct from new.manager_reviewed_at then 'cash_session.manager_reviewed'
      else 'cash_session.updated'
    end,
    'cash_sessions',
    new.id,
    to_jsonb(old),
    to_jsonb(new)
  );
  return new;
end;
$$;

create trigger cash_sessions_log_insert
  after insert on public.cash_sessions
  for each row execute function public.log_cash_session_change();
create trigger cash_sessions_log_update
  after update on public.cash_sessions
  for each row execute function public.log_cash_session_change();

create or replace function public.log_financial_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
begin
  v_actor := public.current_profile_id();
  if tg_op = 'INSERT' then
    insert into public.financial_request_history (
      financial_request_id, action, previous_status, new_status, user_id, notes
    ) values (
      new.id, 'created', null, new.status, new.requester_id, new.justification
    );
    insert into public.management_audit_logs (user_id, action, entity_type, entity_id, new_data)
    values (new.requester_id, 'financial_request.created', 'financial_requests', new.id, to_jsonb(new));
    return new;
  end if;

  if new.status is distinct from old.status
     or new.manager_decision is distinct from old.manager_decision
     or new.paid_at is distinct from old.paid_at
  then
    insert into public.financial_request_history (
      financial_request_id, action, previous_status, new_status, user_id, notes
    ) values (
      new.id,
      case
        when new.status = 'paid' then 'paid'
        when new.manager_decision is not null then 'manager_decision'
        else 'status_changed'
      end,
      old.status,
      new.status,
      coalesce(v_actor, new.manager_id, new.paid_by, new.requester_id),
      coalesce(new.manager_reason, new.justification)
    );

    insert into public.management_audit_logs (user_id, action, entity_type, entity_id, previous_data, new_data)
    values (
      coalesce(v_actor, new.manager_id, new.paid_by, new.requester_id),
      'financial_request.updated',
      'financial_requests',
      new.id,
      to_jsonb(old),
      to_jsonb(new)
    );
  end if;
  return new;
end;
$$;

create trigger financial_requests_log_insert
  after insert on public.financial_requests
  for each row execute function public.log_financial_request_status();
create trigger financial_requests_log_update
  after update on public.financial_requests
  for each row execute function public.log_financial_request_status();

create or replace function public.notify_financial_request_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.status = 'submitted' then
    insert into public.notifications (user_id, title, message, type)
    select p.id, 'Nova solicitacao financeira', new.title, 'warning'
      from public.profiles p
     where p.role in ('gestor', 'diretor', 'admin') and p.status = 'active';
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status in ('approved', 'partially_approved', 'rejected', 'needs_information') then
      insert into public.notifications (user_id, title, message, type)
      values (new.requester_id, 'Solicitacao financeira atualizada', new.title, 'info');
    end if;
    if new.status in ('approved', 'partially_approved') then
      insert into public.notifications (user_id, title, message, type)
      select p.id, 'Solicitacao aprovada para pagamento', new.title, 'success'
        from public.profiles p
       where p.role in ('financeiro', 'admin') and p.status = 'active';
    end if;
    if new.status = 'paid' then
      insert into public.notifications (user_id, title, message, type)
      select p.id, 'Pagamento realizado', new.title, 'success'
        from public.profiles p
       where p.role in ('gestor', 'diretor', 'admin') and p.status = 'active';
    end if;
  end if;
  return new;
end;
$$;

create trigger financial_requests_notify_insert
  after insert on public.financial_requests
  for each row execute function public.notify_financial_request_events();
create trigger financial_requests_notify_update
  after update on public.financial_requests
  for each row execute function public.notify_financial_request_events();

-- -----------------------------------------------------------------------------
-- 7. RLS
-- -----------------------------------------------------------------------------
alter table public.departments enable row level security;
alter table public.cost_centers enable row level security;
alter table public.department_goals enable row level security;
alter table public.manager_reviews enable row level security;
alter table public.cash_registers enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.financial_requests enable row level security;
alter table public.financial_request_history enable row level security;
alter table public.management_audit_logs enable row level security;

create policy "departments_read" on public.departments
  for select to authenticated using (public.can_view_management() or public.has_permission('financial_requests.create') or public.has_permission('cash.read'));
create policy "departments_write_management" on public.departments
  for all to authenticated
  using (public.has_permission('management.goals.manage'))
  with check (public.has_permission('management.goals.manage'));

create policy "cost_centers_read" on public.cost_centers
  for select to authenticated using (public.can_view_management() or public.has_permission('financial_requests.create') or public.has_permission('cash.read'));
create policy "cost_centers_write_management" on public.cost_centers
  for all to authenticated
  using (public.has_permission('management.goals.manage'))
  with check (public.has_permission('management.goals.manage'));

create policy "department_goals_read" on public.department_goals
  for select to authenticated using (
    public.can_view_management()
    or responsible_user_id = public.current_profile_id()
    or exists (select 1 from public.departments d where d.id = department_id and d.manager_id = public.current_profile_id())
  );
create policy "department_goals_write_management" on public.department_goals
  for all to authenticated
  using (public.has_permission('management.goals.manage'))
  with check (public.has_permission('management.goals.manage'));

create policy "manager_reviews_read" on public.manager_reviews
  for select to authenticated using (public.can_view_management() or manager_id = public.current_profile_id());
create policy "manager_reviews_write" on public.manager_reviews
  for all to authenticated
  using (public.has_permission('management.review'))
  with check (public.has_permission('management.review'));

create policy "cash_registers_read" on public.cash_registers
  for select to authenticated using (public.can_read_cash());
create policy "cash_registers_write" on public.cash_registers
  for all to authenticated
  using (public.has_permission('cash.manage') or public.is_admin())
  with check (public.has_permission('cash.manage') or public.is_admin());

create policy "cash_sessions_read" on public.cash_sessions
  for select to authenticated using (public.can_read_cash() or opened_by = public.current_profile_id());
create policy "cash_sessions_insert" on public.cash_sessions
  for insert to authenticated
  with check (
    opened_by = public.current_profile_id()
    and (public.has_permission('cash.manage') or public.can_review_cash())
  );
create policy "cash_sessions_update_finance" on public.cash_sessions
  for update to authenticated
  using (public.has_permission('cash.manage') or public.can_review_cash())
  with check (public.has_permission('cash.manage') or public.can_review_cash());

create policy "cash_movements_read" on public.cash_movements
  for select to authenticated using (public.can_read_cash() or created_by = public.current_profile_id());
create policy "cash_movements_insert" on public.cash_movements
  for insert to authenticated
  with check (
    created_by = public.current_profile_id()
    and public.has_permission('cash.manage')
  );
create policy "cash_movements_update" on public.cash_movements
  for update to authenticated
  using (public.has_permission('cash.manage') or public.can_review_cash())
  with check (public.has_permission('cash.manage') or public.can_review_cash());

create policy "financial_requests_read" on public.financial_requests
  for select to authenticated using (
    public.has_permission('financial_requests.read')
    or requester_id = public.current_profile_id()
  );
create policy "financial_requests_insert" on public.financial_requests
  for insert to authenticated
  with check (
    requester_id = public.current_profile_id()
    and (public.has_permission('financial_requests.create') or public.has_permission('financial_requests.read'))
  );
create policy "financial_requests_update_requester" on public.financial_requests
  for update to authenticated
  using (
    requester_id = public.current_profile_id()
    and status in ('draft', 'needs_information')
  )
  with check (
    requester_id = public.current_profile_id()
    and status in ('draft', 'submitted', 'needs_information', 'cancelled')
  );
create policy "financial_requests_update_manager" on public.financial_requests
  for update to authenticated
  using (public.has_permission('financial_requests.approve'))
  with check (public.has_permission('financial_requests.approve'));
create policy "financial_requests_update_pay" on public.financial_requests
  for update to authenticated
  using (public.has_permission('financial_requests.pay'))
  with check (public.has_permission('financial_requests.pay'));

create policy "fr_history_read" on public.financial_request_history
  for select to authenticated using (
    public.has_permission('financial_requests.read')
    or exists (
      select 1 from public.financial_requests fr
       where fr.id = financial_request_id and fr.requester_id = public.current_profile_id()
    )
  );
create policy "fr_history_insert_system" on public.financial_request_history
  for insert to authenticated with check (
    public.has_permission('financial_requests.create')
    or public.has_permission('financial_requests.approve')
    or public.has_permission('financial_requests.pay')
    or public.is_admin()
  );

create policy "management_audit_logs_read" on public.management_audit_logs
  for select to authenticated using (public.has_permission('audit.read') or public.is_admin());
create policy "management_audit_logs_insert" on public.management_audit_logs
  for insert to authenticated with check (
    public.has_permission('cash.manage')
    or public.has_permission('cash.review')
    or public.has_permission('financial_requests.approve')
    or public.has_permission('financial_requests.pay')
    or public.has_permission('management.review')
    or public.is_admin()
  );

-- Gestor precisa de leitura ampla para dashboards/relatorios, sem permissao de escrita operacional.
create policy "profiles_select_gestor" on public.profiles
  for select to authenticated using (public.can_view_management());
create policy "students_select_gestor" on public.students
  for select to authenticated using (public.can_view_management());
create policy "classes_select_gestor" on public.classes
  for select to authenticated using (public.can_view_management());
create policy "class_students_select_gestor" on public.class_students
  for select to authenticated using (public.can_view_management());
create policy "attendance_select_gestor" on public.attendance
  for select to authenticated using (public.can_view_management());
create policy "attendance_records_select_gestor" on public.attendance_records
  for select to authenticated using (public.can_view_management());
create policy "assessments_select_gestor" on public.assessments
  for select to authenticated using (public.can_view_management());
create policy "grades_select_gestor" on public.grades
  for select to authenticated using (public.can_view_management());
create policy "lessons_select_gestor" on public.lessons
  for select to authenticated using (public.can_view_management());
create policy "slp_select_gestor" on public.student_lesson_progress
  for select to authenticated using (public.can_view_management());
create policy "online_assessments_select_gestor" on public.online_assessments
  for select to authenticated using (public.can_view_management());
create policy "sas_select_gestor" on public.student_assessment_submissions
  for select to authenticated using (public.can_view_management());
create policy "documents_select_gestor" on public.documents
  for select to authenticated using (public.can_view_management());
create policy "invoices_select_gestor" on public.invoices
  for select to authenticated using (public.can_view_management());
create policy "payments_select_gestor" on public.payments
  for select to authenticated using (public.can_view_management());
create policy "financial_logs_select_gestor" on public.financial_logs
  for select to authenticated using (public.can_view_management());
create policy "event_registrations_select_gestor" on public.event_registrations
  for select to authenticated using (public.can_view_management());
