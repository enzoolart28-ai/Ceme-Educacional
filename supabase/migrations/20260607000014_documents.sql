-- =============================================================================
-- Migration: Módulo de Documentos
-- Sistema CME Educacional
-- =============================================================================
-- Documentos do aluno (upload + conferência/aprovação) e documentos gerados
-- automaticamente em PDF (declarações, contratos, recibos…). Arquivos no
-- Supabase Storage em bucket PRIVADO (acesso via URL assinada gerada no servidor
-- após checagem de RLS). Aprovações/reprovações geram log.
--
-- Permissões reutilizadas (já existentes em roles_permissions):
--   documents.read   → diretor, secretaria, aluno, responsavel
--   documents.manage → secretaria (+ admin)
-- Visualização por coordenação/direção é coberta por is_staff() no RLS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.document_type as enum (
  'rg',
  'cpf',
  'comprovante_residencia',
  'historico_escolar',
  'certidao',
  'contrato',
  'termo_matricula',
  'termo_estagio',
  'comprovante_pagamento',
  'outros'
);

create type public.document_status as enum (
  'pendente',  -- solicitado, ainda sem arquivo
  'enviado',   -- enviado pelo aluno/responsável, aguardando conferência
  'aprovado',
  'reprovado'
);

create type public.generated_document_type as enum (
  'declaracao_matricula',
  'declaracao_frequencia',
  'contrato_educacional',
  'historico_escolar',
  'recibo',
  'comprovante_financeiro',
  'relatorio_academico'
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students (id) on delete cascade,
  type        public.document_type not null default 'outros',
  title       text not null,
  file_url    text,  -- caminho no Storage (bucket privado)
  status      public.document_status not null default 'enviado',
  observation text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index documents_student_idx on public.documents (student_id);
create index documents_status_idx on public.documents (status);

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

create table public.generated_documents (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  enrollment_id uuid references public.enrollments (id) on delete set null,
  type          public.generated_document_type not null,
  title         text not null,
  file_url      text not null, -- caminho no Storage
  generated_by  uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index generated_documents_student_idx on public.generated_documents (student_id);

create table public.document_logs (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents (id) on delete cascade,
  changed_by  uuid references public.profiles (id) on delete set null,
  action      text not null,
  detail      text,
  created_at  timestamptz not null default now()
);
create index document_logs_document_idx on public.document_logs (document_id);

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------
alter table public.documents enable row level security;
alter table public.generated_documents enable row level security;
alter table public.document_logs enable row level security;

-- documents: staff vê tudo; aluno os próprios; responsável dos vinculados.
create policy "documents_select" on public.documents
  for select to authenticated
  using (
    public.is_staff()
    or public.is_own_student(student_id)
    or public.guards_student(student_id)
  );
-- envio: aluno (próprio), responsável (vinculado) ou gestor (documents.manage)
create policy "documents_insert" on public.documents
  for insert to authenticated
  with check (
    public.is_own_student(student_id)
    or public.guards_student(student_id)
    or public.has_permission('documents.manage')
  );
-- conferência/edição: somente gestor (secretaria/admin)
create policy "documents_update" on public.documents
  for update to authenticated
  using (public.has_permission('documents.manage'))
  with check (public.has_permission('documents.manage'));
-- exclusão: gestor, ou o próprio/responsável enquanto não aprovado
create policy "documents_delete" on public.documents
  for delete to authenticated
  using (
    public.has_permission('documents.manage')
    or ((public.is_own_student(student_id) or public.guards_student(student_id)) and status <> 'aprovado')
  );

-- generated_documents: staff/own/guardião leem; só gestor gera.
create policy "generated_documents_select" on public.generated_documents
  for select to authenticated
  using (
    public.is_staff()
    or public.is_own_student(student_id)
    or public.guards_student(student_id)
  );
create policy "generated_documents_write" on public.generated_documents
  for all to authenticated
  using (public.has_permission('documents.manage'))
  with check (public.has_permission('documents.manage'));

-- logs: staff lê; inserção atribuída ao próprio ator.
create policy "document_logs_select" on public.document_logs
  for select to authenticated
  using (public.is_staff());
create policy "document_logs_insert" on public.document_logs
  for insert to authenticated
  with check (changed_by = public.current_profile_id());

-- -----------------------------------------------------------------------------
-- 4. Supabase Storage (bucket PRIVADO — acesso via URL assinada)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

-- Leitura/escrita autenticada no bucket; a descoberta do caminho é protegida
-- pelo RLS das tabelas (file_url só visível a quem pode ver o documento) e as
-- URLs são assinadas e expiram. Update/delete restritos ao dono ou staff.
create policy "documents_storage_read" on storage.objects
  for select to authenticated using (bucket_id = 'documents');
create policy "documents_storage_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');
create policy "documents_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and (owner = auth.uid() or public.is_staff()));
create policy "documents_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (owner = auth.uid() or public.is_staff()));
