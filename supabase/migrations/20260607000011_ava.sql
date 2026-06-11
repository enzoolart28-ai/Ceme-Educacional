-- =============================================================================
-- Migration: Módulo AVA / EAD (ambiente virtual de aprendizagem)
-- Sistema CME Educacional
-- =============================================================================
-- Aulas (lessons) organizadas por curso/módulo/disciplina, com materiais
-- (lesson_materials no Supabase Storage) e progresso do aluno
-- (student_lesson_progress). Regras de liberação por tipo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.lesson_status as enum ('draft', 'published', 'archived');

create type public.lesson_release_type as enum (
  'all',             -- liberada para todos
  'date',            -- liberada a partir de uma data
  'after_previous'   -- liberada após concluir a aula anterior
);

create type public.material_type as enum ('video', 'pdf', 'slides', 'link', 'file');

create type public.lesson_progress_status as enum (
  'not_started',
  'in_progress',
  'completed'
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.lessons (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  module_id    uuid references public.course_modules (id) on delete set null,
  subject_id   uuid references public.subjects (id) on delete set null,
  title        text not null,
  description  text,
  video_url    text,
  release_type public.lesson_release_type not null default 'all',
  release_date date,
  order_index  int not null default 0,
  status       public.lesson_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index lessons_course_idx on public.lessons (course_id);
create index lessons_status_idx on public.lessons (status);

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

create table public.lesson_materials (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references public.lessons (id) on delete cascade,
  title        text not null,
  type         public.material_type not null default 'file',
  file_url     text,
  external_url text,
  created_at   timestamptz not null default now()
);
create index lesson_materials_lesson_idx on public.lesson_materials (lesson_id);

create table public.student_lesson_progress (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.students (id) on delete cascade,
  lesson_id           uuid not null references public.lessons (id) on delete cascade,
  status              public.lesson_progress_status not null default 'not_started',
  completed_at        timestamptz,
  progress_percentage int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (student_id, lesson_id)
);
create index slp_student_idx on public.student_lesson_progress (student_id);
create index slp_lesson_idx on public.student_lesson_progress (lesson_id);

create trigger slp_set_updated_at
  before update on public.student_lesson_progress
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Helpers
-- -----------------------------------------------------------------------------
-- Gestor de conteúdo: coordenação/admin (curriculum/courses) e professor
-- autorizado (grades.manage).
create or replace function public.can_manage_content()
returns boolean language sql stable security definer set search_path = public
as $$
  select public.has_permission('courses.manage')
      or public.has_permission('curriculum.manage')
      or public.has_permission('grades.manage');
$$;

-- Aluno logado está matriculado em alguma turma do curso?
create or replace function public.enrolled_in_course(p_course uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.enrollments e
      join public.classes c on c.id = e.class_id
     where c.course_id = p_course
       and e.student_id = public.current_profile_id()
  );
$$;

-- Responsável logado tem dependente matriculado em alguma turma do curso?
create or replace function public.guardian_of_course_student(p_course uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.student_guardians sg
      join public.guardians g on g.id = sg.guardian_id
      join public.class_students cs on cs.student_id = sg.student_id
      join public.classes c on c.id = cs.class_id
     where g.profile_id = public.current_profile_id()
       and c.course_id = p_course
  );
$$;

-- O registro de student pertence ao usuário logado (aluno marcando progresso)?
create or replace function public.is_own_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.students s
     where s.id = p_student and s.profile_id = public.current_profile_id()
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
alter table public.lessons enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.student_lesson_progress enable row level security;

-- lessons: gestores tudo; aluno/responsável só publicadas dos cursos vinculados.
create policy "lessons_select" on public.lessons
  for select to authenticated
  using (
    public.can_manage_content()
    or (
      status = 'published'
      and (
        public.enrolled_in_course(course_id)
        or public.guardian_of_course_student(course_id)
      )
    )
  );
create policy "lessons_write" on public.lessons
  for all to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

-- lesson_materials: visíveis se a aula é visível; escrita por gestor de conteúdo.
create policy "lesson_materials_select" on public.lesson_materials
  for select to authenticated
  using (
    public.can_manage_content()
    or exists (
      select 1 from public.lessons l
       where l.id = lesson_id
         and l.status = 'published'
         and (
           public.enrolled_in_course(l.course_id)
           or public.guardian_of_course_student(l.course_id)
         )
    )
  );
create policy "lesson_materials_write" on public.lesson_materials
  for all to authenticated
  using (public.can_manage_content())
  with check (public.can_manage_content());

-- student_lesson_progress: aluno o próprio; responsável dos vinculados; gestores.
create policy "slp_select" on public.student_lesson_progress
  for select to authenticated
  using (
    public.can_manage_content()
    or public.is_staff()
    or public.is_own_student(student_id)
    or public.guards_student(student_id)
  );
-- Aluno pode registrar/atualizar o PRÓPRIO progresso; gestores também.
create policy "slp_write" on public.student_lesson_progress
  for all to authenticated
  using (public.is_own_student(student_id) or public.can_manage_content())
  with check (public.is_own_student(student_id) or public.can_manage_content());

-- -----------------------------------------------------------------------------
-- 5. Supabase Storage (materiais)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('lesson-materials', 'lesson-materials', true)
  on conflict (id) do nothing;

create policy "ava_materials_read" on storage.objects
  for select to authenticated using (bucket_id = 'lesson-materials');
create policy "ava_materials_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lesson-materials' and public.can_manage_content());
create policy "ava_materials_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'lesson-materials' and public.can_manage_content());
create policy "ava_materials_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lesson-materials' and public.can_manage_content());
