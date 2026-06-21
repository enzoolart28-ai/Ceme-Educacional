-- =============================================================================
-- Teste de RLS do módulo Campanhas (permissão campaigns.manage)
-- Esperado:
--   admin / coordenacao / secretaria  -> LEEM (>0) e INSEREM (OK)
--   diretor / financeiro / aluno      -> NÃO leem (0) e INSERT BLOQUEADO
-- =============================================================================
\set ON_ERROR_STOP off

CREATE OR REPLACE FUNCTION pg_temp.as_user(p_email text) RETURNS void AS $$
DECLARE uid uuid;
BEGIN
  SELECT u.id INTO uid FROM auth.users u WHERE u.email = p_email;
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated', 'email', p_email)::text,
    true
  );
END;
$$ LANGUAGE plpgsql;

-- Tenta inserir uma campanha e relata OK / BLOQUEADO (sempre faz rollback do efeito).
CREATE OR REPLACE FUNCTION pg_temp.try_insert(p_email text) RETURNS text AS $$
BEGIN
  PERFORM pg_temp.as_user(p_email);
  INSERT INTO public.campaigns (name, status) VALUES ('__rls_probe__', 'rascunho');
  -- Se chegou aqui, o insert passou. Remove o vestígio mantendo o contexto do usuário.
  DELETE FROM public.campaigns WHERE name = '__rls_probe__';
  RETURN 'INSERT OK';
EXCEPTION WHEN insufficient_privilege OR check_violation THEN
  RETURN 'INSERT BLOQUEADO';
END;
$$ LANGUAGE plpgsql;

\echo ''
\echo '======== LEITURA (count visível por papel) ========'
BEGIN; SELECT pg_temp.as_user('admin@cme.local');       SELECT 'admin'       AS papel, count(*) AS visiveis FROM public.campaigns; ROLLBACK; RESET ROLE;
BEGIN; SELECT pg_temp.as_user('coordenacao@cme.local'); SELECT 'coordenacao' AS papel, count(*) AS visiveis FROM public.campaigns; ROLLBACK; RESET ROLE;
BEGIN; SELECT pg_temp.as_user('secretaria@cme.local');  SELECT 'secretaria'  AS papel, count(*) AS visiveis FROM public.campaigns; ROLLBACK; RESET ROLE;
BEGIN; SELECT pg_temp.as_user('diretor@cme.local');     SELECT 'diretor'     AS papel, count(*) AS visiveis FROM public.campaigns; ROLLBACK; RESET ROLE;
BEGIN; SELECT pg_temp.as_user('financeiro@cme.local');  SELECT 'financeiro'  AS papel, count(*) AS visiveis FROM public.campaigns; ROLLBACK; RESET ROLE;
BEGIN; SELECT pg_temp.as_user('aluno@cme.local');       SELECT 'aluno'       AS papel, count(*) AS visiveis FROM public.campaigns; ROLLBACK; RESET ROLE;

\echo ''
\echo '======== ESCRITA (insert por papel) ========'
BEGIN; SELECT 'admin'       AS papel, pg_temp.try_insert('admin@cme.local')       AS resultado; ROLLBACK; RESET ROLE;
BEGIN; SELECT 'coordenacao' AS papel, pg_temp.try_insert('coordenacao@cme.local') AS resultado; ROLLBACK; RESET ROLE;
BEGIN; SELECT 'secretaria'  AS papel, pg_temp.try_insert('secretaria@cme.local')  AS resultado; ROLLBACK; RESET ROLE;
BEGIN; SELECT 'diretor'     AS papel, pg_temp.try_insert('diretor@cme.local')     AS resultado; ROLLBACK; RESET ROLE;
BEGIN; SELECT 'financeiro'  AS papel, pg_temp.try_insert('financeiro@cme.local')  AS resultado; ROLLBACK; RESET ROLE;
BEGIN; SELECT 'aluno'       AS papel, pg_temp.try_insert('aluno@cme.local')       AS resultado; ROLLBACK; RESET ROLE;
