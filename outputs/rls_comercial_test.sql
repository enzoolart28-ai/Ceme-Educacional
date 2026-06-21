-- =============================================================================
-- Teste de RLS — perfil Comercial (matrícula)
-- Esperado:
--   comercial: LÊ alunos e turmas; INSERE aluno; INSERE class_students (matrícula).
--   comercial: NÃO altera profiles (não é staff) — proteção contra escalonamento.
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
\echo '==== LEITURA (comercial vê alunos e turmas) ===='
begin; select pg_temp.as_user('comercial@cme.local'); select 'alunos visiveis' t, count(*) from public.students; rollback; reset role;
begin; select pg_temp.as_user('comercial@cme.local'); select 'turmas visiveis' t, count(*) from public.classes; rollback; reset role;

\echo ''
\echo '==== ESCRITA (comercial cria aluno + matricula) ===='
do $$
declare v_sid uuid; v_cid uuid;
begin
  perform pg_temp.as_user('comercial@cme.local');
  insert into public.students (full_name, status) values ('__probe_comercial__', 'active') returning id into v_sid;
  select id into v_cid from public.classes limit 1;
  if v_cid is not null then
    insert into public.class_students (class_id, student_id, status) values (v_cid, v_sid, 'active');
    raise notice 'comercial cria aluno + matricula -> OK';
  else
    raise notice 'comercial cria aluno -> OK (sem turma p/ matricular)';
  end if;
  -- limpa o vestígio
  delete from public.class_students where student_id = v_sid;
  delete from public.students where id = v_sid;
exception when insufficient_privilege then raise notice 'comercial cria aluno/matricula -> BLOQUEADO (ERRADO)';
end $$;
reset role;

\echo ''
\echo '==== SEGURANCA (comercial NAO altera papel de outro usuario) ===='
do $$
declare v_pid uuid;
begin
  perform pg_temp.as_user('comercial@cme.local');
  select id into v_pid from public.profiles where email = 'aluno@cme.local';
  update public.profiles set role = 'admin' where id = v_pid;
  if found then raise notice 'comercial alterou profile -> PERMITIDO (ERRADO!)';
  else raise notice 'comercial alterar profile -> sem efeito/bloqueado (correto)';
  end if;
exception when insufficient_privilege then raise notice 'comercial alterar profile -> BLOQUEADO (correto)';
end $$;
reset role;
