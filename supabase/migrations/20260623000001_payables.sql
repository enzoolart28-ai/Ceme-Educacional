-- =============================================================================
-- Migration: Contas a Pagar (Despesas) — controle financeiro de despesas
-- =============================================================================
-- Espelha a planilha de controle financeiro da escola: categorias de despesa,
-- favorecidos (com chave PIX) e contas a pagar por mês de competência, com
-- status (pendente/pago/vencido/cancelado) e vínculo opcional ao Fluxo de Caixa.
-- Acesso: finance.read (ver) / finance.manage (gerir). Dados sensíveis
-- (salários, PIX) ficam restritos a quem tem essas permissões.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.payable_status as enum ('pendente', 'pago', 'vencido', 'cancelado');
create type public.payee_type as enum ('colaborador', 'professor', 'preceptor', 'fornecedor', 'outro');

-- -----------------------------------------------------------------------------
-- 2. Categorias de despesa
-- -----------------------------------------------------------------------------
create table public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Favorecidos (quem recebe o pagamento)
-- -----------------------------------------------------------------------------
create table public.payees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        public.payee_type not null default 'fornecedor',
  pix_key     text,
  profile_id  uuid references public.profiles (id) on delete set null,
  notes       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index payees_name_idx on public.payees (name);

-- -----------------------------------------------------------------------------
-- 4. Contas a pagar (lançamentos por mês de competência)
-- -----------------------------------------------------------------------------
create table public.payables (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references public.expense_categories (id) on delete restrict,
  payee_id          uuid references public.payees (id) on delete set null,
  description       text not null,
  competence_month  int not null check (competence_month between 1 and 12),
  competence_year   int not null check (competence_year between 2020 and 2100),
  amount            numeric(12, 2) not null default 0 check (amount >= 0),
  due_date          date,
  status            public.payable_status not null default 'pendente',
  paid_at           date,
  recurring         boolean not null default false,
  notes             text,
  -- Vínculo opcional com o Fluxo de Caixa (preenchido ao integrar o pagamento).
  cash_movement_id  uuid references public.cash_movements (id) on delete set null,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index payables_competence_idx on public.payables (competence_year, competence_month);
create index payables_category_idx on public.payables (category_id);
create index payables_status_idx on public.payables (status);
create index payables_payee_idx on public.payables (payee_id);

-- -----------------------------------------------------------------------------
-- 5. Triggers updated_at
-- -----------------------------------------------------------------------------
create trigger payees_set_updated_at
  before update on public.payees
  for each row execute function public.set_updated_at();
create trigger payables_set_updated_at
  before update on public.payables
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. RLS — finance.read (ver) / finance.manage (gerir)
-- -----------------------------------------------------------------------------
alter table public.expense_categories enable row level security;
alter table public.payees enable row level security;
alter table public.payables enable row level security;

create policy "expense_categories_select" on public.expense_categories
  for select to authenticated using (public.has_permission('finance.read'));
create policy "expense_categories_write" on public.expense_categories
  for all to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

create policy "payees_select" on public.payees
  for select to authenticated using (public.has_permission('finance.read'));
create policy "payees_write" on public.payees
  for all to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

create policy "payables_select" on public.payables
  for select to authenticated using (public.has_permission('finance.read'));
create policy "payables_write" on public.payables
  for all to authenticated
  using (public.has_permission('finance.manage'))
  with check (public.has_permission('finance.manage'));

-- -----------------------------------------------------------------------------
-- 7. Seed das categorias (espelha a planilha) — idempotente
-- -----------------------------------------------------------------------------
insert into public.expense_categories (name, description, sort_order) values
  ('Funcionários',     'Salários e encargos de funcionários', 1),
  ('Professores',      'Pagamentos dos professores',          2),
  ('Preceptores',      'Pagamento dos preceptores',           3),
  ('Aluguel',          'Aluguel do espaço',                   4),
  ('Energia',          'Conta de energia elétrica',           5),
  ('Internet',         'Plano de internet',                   6),
  ('IPTU',             'Imposto (não mensal)',                7),
  ('Seguro Alunos',    'Seguro escolar dos alunos',           8),
  ('Despesas Variadas','Despesas diversas/avulsas',           9)
on conflict (name) do nothing;
