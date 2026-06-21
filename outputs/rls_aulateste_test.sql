-- =============================================================================
-- Teste de RLS (smoke) — Aula-Teste (M1)
-- Esperado:
--   at_reports / at_candidates: gestão (admin/diretor/coordenacao/secretaria) LÊ;
--     professor (só evaluate) e aluno NÃO leem candidatos; relatório só se for avaliador.
--   at_criteria: qualquer autenticado lê (76 critérios semeados).
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
\echo '==== at_reports (gestão lê; professor/aluno não) ===='
begin; select pg_temp.as_user('admin@cme.local');       select 'admin'       p, count(*) from public.at_reports; rollback; reset role;
begin; select pg_temp.as_user('coordenacao@cme.local'); select 'coordenacao' p, count(*) from public.at_reports; rollback; reset role;
begin; select pg_temp.as_user('secretaria@cme.local');  select 'secretaria'  p, count(*) from public.at_reports; rollback; reset role;
begin; select pg_temp.as_user('professor@cme.local');   select 'professor'   p, count(*) from public.at_reports; rollback; reset role;
begin; select pg_temp.as_user('aluno@cme.local');       select 'aluno'       p, count(*) from public.at_reports; rollback; reset role;

\echo ''
\echo '==== at_candidates (só gestão; protege CPF) ===='
begin; select pg_temp.as_user('coordenacao@cme.local'); select 'coordenacao' p, count(*) from public.at_candidates; rollback; reset role;
begin; select pg_temp.as_user('professor@cme.local');   select 'professor'   p, count(*) from public.at_candidates; rollback; reset role;
begin; select pg_temp.as_user('aluno@cme.local');       select 'aluno'       p, count(*) from public.at_candidates; rollback; reset role;

\echo ''
\echo '==== at_criteria (todo autenticado lê) ===='
begin; select pg_temp.as_user('professor@cme.local'); select 'professor' p, count(*) as criterios from public.at_criteria; rollback; reset role;
begin; select pg_temp.as_user('aluno@cme.local');     select 'aluno'     p, count(*) as criterios from public.at_criteria; rollback; reset role;

\echo ''
\echo '==== escrita: coordenação cria candidato (OK) / professor (BLOQUEADO) ===='
do $$
begin
  perform pg_temp.as_user('coordenacao@cme.local');
  insert into public.at_candidates (full_name) values ('__probe__');
  delete from public.at_candidates where full_name = '__probe__';
  raise notice 'coordenacao cria candidato -> OK';
exception when insufficient_privilege then raise notice 'coordenacao cria candidato -> BLOQUEADO (ERRADO)';
end $$;
reset role;

do $$
begin
  perform pg_temp.as_user('professor@cme.local');
  insert into public.at_candidates (full_name) values ('__probe2__');
  raise notice 'professor cria candidato -> OK (ERRADO)';
exception when insufficient_privilege then raise notice 'professor cria candidato -> BLOQUEADO (correto)';
end $$;
reset role;
