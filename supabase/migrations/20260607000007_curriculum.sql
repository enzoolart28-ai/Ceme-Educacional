-- =============================================================================
-- Migration: Currículo (disciplinas + módulos + componentes curriculares)
-- Sistema CME Educacional
-- =============================================================================
-- Ajusta `subjects`, `course_modules` e `course_subjects` para organizar os
-- cursos em módulos e disciplinas ordenadas, com carga horária e professor
-- responsável (quando aplicável).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. subjects: descrição, carga horária e status
-- -----------------------------------------------------------------------------
create type public.subject_status as enum ('active', 'inactive');

alter table public.subjects
  add column description    text,
  add column workload_hours int,
  add column status         public.subject_status not null default 'active';

update public.subjects
   set status = (case when is_active then 'active' else 'inactive' end)::public.subject_status;

alter table public.subjects drop column is_active;

create index subjects_status_idx on public.subjects (status);

-- -----------------------------------------------------------------------------
-- 2. course_modules: position -> order_index
-- -----------------------------------------------------------------------------
alter table public.course_modules rename column position to order_index;

-- -----------------------------------------------------------------------------
-- 3. course_subjects: módulo, ordem, carga e professor responsável
-- -----------------------------------------------------------------------------
alter table public.course_subjects
  add column module_id      uuid references public.course_modules (id) on delete set null,
  add column order_index    int  not null default 0,
  add column workload_hours int,
  add column teacher_id     uuid references public.teachers (id) on delete set null;

create index course_subjects_module_idx on public.course_subjects (module_id);

-- -----------------------------------------------------------------------------
-- 4. Permissão de currículo (coordenação e administrador)
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('curriculum.manage', 'Gerenciar currículo', 'Gerenciar disciplinas, módulos e componentes curriculares.');

insert into public.role_permissions (role_key, permission_key) values
  ('admin', 'curriculum.manage'),
  ('coordenacao', 'curriculum.manage');

-- Disciplinas passam a ser gerenciáveis por quem tem academic.manage
-- (secretaria/admin) OU curriculum.manage (coordenação/admin).
drop policy if exists "subjects_write" on public.subjects;
create policy "subjects_write" on public.subjects
  for all to authenticated
  using (
    public.has_permission('academic.manage')
    or public.has_permission('curriculum.manage')
  )
  with check (
    public.has_permission('academic.manage')
    or public.has_permission('curriculum.manage')
  );
