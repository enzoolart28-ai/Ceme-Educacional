-- =============================================================================
-- Migration: Acesso Familiar Automatico
-- Sistema CME Educacional
-- =============================================================================

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

alter table public.guardians
  add column if not exists auto_family_key text,
  add column if not exists review_required boolean not null default false,
  add column if not exists account_created_at timestamptz;

create index if not exists guardians_auto_family_key_idx
  on public.guardians (auto_family_key)
  where auto_family_key is not null;

create table public.guardian_login_aliases (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardians (id) on delete cascade,
  student_id uuid not null unique references public.students (id) on delete cascade,
  login_cpf text not null unique,
  created_at timestamptz not null default now(),
  constraint guardian_login_aliases_cpf_check check (login_cpf ~ '^[0-9]{11}$'),
  unique (guardian_id, student_id)
);

create index guardian_login_aliases_guardian_idx
  on public.guardian_login_aliases (guardian_id);

alter table public.guardian_login_aliases enable row level security;

create policy "guardian_login_aliases_select" on public.guardian_login_aliases
  for select to authenticated
  using (
    public.has_permission('guardians.manage')
    or guardian_id = public.current_guardian_id()
  );

create policy "guardian_login_aliases_write" on public.guardian_login_aliases
  for all to authenticated
  using (public.has_permission('guardians.manage'))
  with check (public.has_permission('guardians.manage'));

comment on table public.guardian_login_aliases is
  'Mapeia o CPF de cada aluno para a conta familiar do responsavel.';
