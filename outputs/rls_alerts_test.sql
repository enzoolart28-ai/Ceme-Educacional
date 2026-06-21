-- =============================================================================
-- Teste de RLS + geração do módulo Alertas
-- Dados semeados (7 alertas): frequencia_baixa, faltas_consecutivas (acadêmicos),
-- mensalidade_vencida (financeiro), documento_pendente + certificado_pendente
-- (documentos), lead_sem_retorno (comercial), evento_proximo (evento).
-- Visibilidade esperada (can_view_alert):
--   admin/diretor -> 7 ; coordenacao -> 4 ; financeiro -> 1 ;
--   secretaria -> 4 ; professor -> 0 ; aluno -> 0
-- =============================================================================
\set ON_ERROR_STOP off

create or replace function pg_temp.as_user(p_email text) returns void as $$
declare uid uuid;
begin
  select u.id into uid from auth.users u where u.email = p_email;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated', 'email', p_email)::text, true);
end;
$$ language plpgsql;

\echo ''
\echo '======== VISIBILIDADE POR PAPEL (alertas semeados) ========'
begin; select pg_temp.as_user('admin@cme.local');       select 'admin'       as papel, count(*) from public.alerts; rollback; reset role;
begin; select pg_temp.as_user('diretor@cme.local');     select 'diretor'     as papel, count(*) from public.alerts; rollback; reset role;
begin; select pg_temp.as_user('coordenacao@cme.local'); select 'coordenacao' as papel, count(*) from public.alerts; rollback; reset role;
begin; select pg_temp.as_user('financeiro@cme.local');  select 'financeiro'  as papel, count(*) from public.alerts; rollback; reset role;
begin; select pg_temp.as_user('secretaria@cme.local');  select 'secretaria'  as papel, count(*) from public.alerts; rollback; reset role;
begin; select pg_temp.as_user('professor@cme.local');   select 'professor'   as papel, count(*) from public.alerts; rollback; reset role;
begin; select pg_temp.as_user('aluno@cme.local');       select 'aluno'       as papel, count(*) from public.alerts; rollback; reset role;

\echo ''
\echo '======== GERAÇÃO (admin pode; aluno bloqueado) ========'
begin;
  select pg_temp.as_user('admin@cme.local');
  select 'admin gera' as teste, public.generate_alerts() as alertas_criados;
rollback; reset role;

do $$
begin
  perform pg_temp.as_user('aluno@cme.local');
  perform public.generate_alerts();
  raise notice 'aluno gera -> PERMITIDO (ERRADO)';
exception when insufficient_privilege then
  raise notice 'aluno gera -> BLOQUEADO (correto)';
end $$;
reset role;
