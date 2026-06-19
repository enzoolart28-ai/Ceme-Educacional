-- =============================================================================
-- Migration: Comercial pode fazer matrículas
-- Sistema CME Educacional
-- =============================================================================
-- O setor comercial fecha a venda e matricula o aluno. Liberação CIRÚRGICA
-- (sem entrar em is_staff(), que daria leitura/escrita ampla — inclusive em
-- profiles): apenas ver alunos/turmas e gerenciar o vínculo aluno-turma.
-- =============================================================================

-- 1. Permissões: criar/editar alunos e ver turmas.
insert into public.role_permissions (role_key, permission_key) values
  ('comercial', 'students.manage'),
  ('comercial', 'classes.read')
on conflict do nothing;

-- 2. Comercial enxerga os alunos (para matricular e acompanhar).
create policy "students_select_comercial" on public.students
  for select to authenticated
  using (public.current_user_role() = 'comercial');

-- 3. Comercial enxerga as turmas (para escolher na matrícula).
create policy "classes_select_comercial" on public.classes
  for select to authenticated
  using (public.current_user_role() = 'comercial');

-- 4. Comercial enxerga os cursos (contexto da turma).
create policy "courses_select_comercial" on public.courses
  for select to authenticated
  using (public.current_user_role() = 'comercial');

-- 5. Quem gerencia alunos (inclui comercial) pode gerenciar o vínculo turma↔aluno
--    (matrícula). Política aditiva — não altera as existentes.
create policy "class_students_manage_by_students" on public.class_students
  for all to authenticated
  using (public.has_permission('students.manage'))
  with check (public.has_permission('students.manage'));
