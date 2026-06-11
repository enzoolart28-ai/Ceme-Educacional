-- =============================================================================
-- Migration: Módulo de Gestão de Alunos
-- Sistema CME Educacional
-- =============================================================================
-- Tabela `students` (cadastro completo do aluno), distinta de `profiles`.
-- profile_id (opcional) liga o cadastro a uma conta de login, permitindo as
-- regras: aluno vê só seus dados; responsável vê vinculados; professor vê
-- alunos das turmas que leciona. Gestores (admin/diretor/coordenação/secretaria)
-- gerenciam tudo. Soft-delete via deleted_at; exclusão permanente só admin.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum de status do aluno
-- -----------------------------------------------------------------------------
create type public.student_status as enum (
  'active',       -- Ativo
  'inactive',     -- Inativo
  'defaulter',    -- Inadimplente
  'locked',       -- Trancado
  'transferred',  -- Transferido
  'completed',    -- Concluído
  'dropout'       -- Desistente
);

-- -----------------------------------------------------------------------------
-- 2. Tabela students
-- -----------------------------------------------------------------------------
create table public.students (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid unique references public.profiles (id) on delete set null,
  full_name   text not null,
  cpf         text unique,
  rg          text,
  birth_date  date,
  phone       text,
  email       text,
  address     text,
  city        text,
  state       text,
  mother_name text,
  father_name text,
  status      public.student_status not null default 'active',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.students is 'Cadastro completo de alunos. profile_id liga a uma conta de login (opcional).';
comment on column public.students.deleted_at is 'Soft-delete: quando preenchido, o aluno fica arquivado (não some do banco).';

create index students_status_idx on public.students (status);
create index students_deleted_at_idx on public.students (deleted_at);
create index students_profile_id_idx on public.students (profile_id);
create index students_full_name_idx on public.students (full_name);

create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Permissões (gestão de alunos)
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('students.manage', 'Gerenciar alunos', 'Cadastrar, editar e arquivar alunos.');

-- admin (linha explícita, além do atalho em has_permission), diretor,
-- coordenação e secretaria gerenciam alunos.
insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'students.manage'),
  ('diretor', 'students.manage'),
  ('coordenacao', 'students.manage'),
  ('secretaria', 'students.manage');

-- Diretor passa a poder visualizar alunos.
insert into public.role_permissions (role_key, permission_key) values
  ('diretor', 'students.read')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
alter table public.students enable row level security;

-- Leitura por escopo de perfil.
create policy "students_select" on public.students
  for select to authenticated
  using (
    public.has_permission('students.manage')                       -- gestores: todos
    or (profile_id = public.current_profile_id())                  -- aluno: o próprio
    or (profile_id is not null and public.is_guardian_of(profile_id)) -- responsável
    or (                                                            -- professor: suas turmas
      public.has_permission('students.read')
      and profile_id is not null
      and exists (
        select 1
          from public.enrollments e
          join public.teacher_assignments ta on ta.class_id = e.class_id
         where e.student_id = public.students.profile_id
           and ta.teacher_id = public.current_profile_id()
      )
    )
  );

-- Escrita (insert/update) apenas para gestores.
create policy "students_insert" on public.students
  for insert to authenticated
  with check (public.has_permission('students.manage'));

create policy "students_update" on public.students
  for update to authenticated
  using (public.has_permission('students.manage'))
  with check (public.has_permission('students.manage'));

-- Exclusão permanente apenas para admin (soft-delete é via update de deleted_at).
create policy "students_delete" on public.students
  for delete to authenticated
  using (public.is_admin());
