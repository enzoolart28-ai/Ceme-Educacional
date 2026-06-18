-- =============================================================================
-- Migration: Remover o módulo Relatório Avaliativo de Aula-Teste
-- Sistema CME Educacional
-- =============================================================================
-- Remove tudo que a migration 20260607000021_aula_teste.sql criou. Tudo usa
-- IF EXISTS / idempotente, então é seguro independente de o 021 já ter sido
-- aplicado ou não no banco.
-- =============================================================================

-- 1. Permissões
delete from public.role_permissions where permission_key in ('aulateste.manage', 'aulateste.evaluate');
delete from public.permissions where key in ('aulateste.manage', 'aulateste.evaluate');

-- 2. Storage (políticas e bucket). A remoção do bucket é tolerante a falhas
--    (o Supabase bloqueia delete direto em storage.objects; um bucket vazio sai
--    normalmente, e se houver objetos apenas mantemos o bucket — é inofensivo).
drop policy if exists "at_storage_read" on storage.objects;
drop policy if exists "at_storage_insert" on storage.objects;
drop policy if exists "at_storage_update" on storage.objects;
drop policy if exists "at_storage_delete" on storage.objects;
do $$
begin
  delete from storage.buckets where id = 'aula-teste';
exception when others then
  null;
end $$;

-- 3. Tabelas (cascade remove índices, policies e constraints dependentes)
drop table if exists public.at_logs cascade;
drop table if exists public.at_signatures cascade;
drop table if exists public.at_attachments cascade;
drop table if exists public.at_guardian_responses cascade;
drop table if exists public.at_student_responses cascade;
drop table if exists public.at_evaluation_scores cascade;
drop table if exists public.at_evaluations cascade;
drop table if exists public.at_criteria cascade;
drop table if exists public.at_reports cascade;
drop table if exists public.at_candidates cascade;
drop table if exists public.at_settings cascade;

-- 4. Funções auxiliares
drop function if exists public.can_manage_aulateste() cascade;
drop function if exists public.is_aulateste_evaluator(uuid) cascade;

-- 5. Enums
drop type if exists public.at_report_status cascade;
drop type if exists public.at_process_status cascade;
drop type if exists public.at_evaluation_type cascade;
drop type if exists public.at_attachment_kind cascade;
drop type if exists public.at_signature_role cascade;
drop type if exists public.at_teaching_modality cascade;
