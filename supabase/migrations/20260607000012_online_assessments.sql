-- =============================================================================
-- Migration: Módulo de Atividades e Provas Online
-- Sistema CME Educacional
-- =============================================================================
-- Atividades/provas/questionários interativos (online_assessments) com questões
-- (assessment_questions), alternativas (assessment_options), tentativas dos
-- alunos (student_assessment_submissions) e respostas (student_answers), além de
-- log de alterações (online_assessment_logs).
--
-- SEGURANÇA: o gabarito (assessment_options.is_correct) NUNCA é exposto ao aluno
-- — RLS não esconde colunas, então o aluno lê o enunciado/alternativas e grava
-- respostas EXCLUSIVAMENTE via funções SECURITY DEFINER que omitem o gabarito e
-- fazem a correção automática no servidor. Escrita direta nas tabelas de
-- questões/alternativas/respostas é restrita a quem gerencia a prova.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.online_assessment_status as enum (
  'draft',       -- rascunho (só gestores veem)
  'published',   -- publicada (aluno responde)
  'closed',      -- encerrada (não aceita novas respostas)
  'archived'     -- arquivada
);

create type public.assessment_correction_type as enum (
  'automatic',   -- corrige questões objetivas automaticamente
  'manual'       -- tudo corrigido manualmente pelo professor
);

create type public.question_type as enum (
  'multiple_choice', -- múltipla escolha (objetiva)
  'true_false',      -- verdadeiro ou falso (objetiva)
  'essay',           -- dissertativa (manual)
  'file_upload',     -- envio de arquivo (manual)
  'image',           -- questão com imagem (enunciado com mídia, resposta livre)
  'video',           -- questão com vídeo (enunciado com mídia, resposta livre)
  'matching'         -- associação de colunas (objetiva)
);

create type public.submission_status as enum (
  'in_progress', -- tentativa em andamento
  'submitted',   -- enviada, aguardando correção manual
  'graded'       -- corrigida (nota final disponível)
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.online_assessments (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  description        text,
  course_id          uuid references public.courses (id) on delete set null,
  class_id           uuid not null references public.classes (id) on delete cascade,
  subject_id         uuid references public.subjects (id) on delete set null,
  teacher_id         uuid references public.teachers (id) on delete set null,
  start_date         timestamptz,
  end_date           timestamptz,
  time_limit_minutes int,
  max_attempts       int not null default 1,
  max_grade          numeric(6, 2) not null default 10,
  min_grade          numeric(6, 2) not null default 6,
  correction_type    public.assessment_correction_type not null default 'automatic',
  show_answer_key    boolean not null default false,
  shuffle_questions  boolean not null default false,
  shuffle_options    boolean not null default false,
  status             public.online_assessment_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index oa_class_idx on public.online_assessments (class_id);
create index oa_status_idx on public.online_assessments (status);

create trigger oa_set_updated_at
  before update on public.online_assessments
  for each row execute function public.set_updated_at();

create table public.assessment_questions (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.online_assessments (id) on delete cascade,
  type          public.question_type not null default 'multiple_choice',
  statement     text not null,
  media_url     text,
  points        numeric(6, 2) not null default 1,
  order_index   int not null default 0,
  created_at    timestamptz not null default now()
);
create index aq_assessment_idx on public.assessment_questions (assessment_id);

create table public.assessment_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.assessment_questions (id) on delete cascade,
  -- Para 'matching' o texto guarda o par "esquerda:::direita" (delimitador :::).
  text        text not null,
  is_correct  boolean not null default false,
  order_index int not null default 0
);
create index ao_question_idx on public.assessment_options (question_id);

create table public.student_assessment_submissions (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.online_assessments (id) on delete cascade,
  student_id     uuid not null references public.students (id) on delete cascade,
  attempt_number int not null default 1,
  status         public.submission_status not null default 'in_progress',
  started_at     timestamptz not null default now(),
  submitted_at   timestamptz,
  grade          numeric(6, 2),
  feedback       text,
  reopened_at    timestamptz, -- reabertura pelo professor (permite reenvio fora do prazo)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (assessment_id, student_id, attempt_number)
);
create index sas_assessment_idx on public.student_assessment_submissions (assessment_id);
create index sas_student_idx on public.student_assessment_submissions (student_id);

create trigger sas_set_updated_at
  before update on public.student_assessment_submissions
  for each row execute function public.set_updated_at();

create table public.student_answers (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      uuid not null references public.student_assessment_submissions (id) on delete cascade,
  question_id        uuid not null references public.assessment_questions (id) on delete cascade,
  answer_text        text,  -- dissertativa, ou JSON de pareamento p/ matching
  selected_option_id uuid references public.assessment_options (id) on delete set null,
  file_url           text,
  grade              numeric(6, 2),
  feedback           text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (submission_id, question_id)
);
create index sa_submission_idx on public.student_answers (submission_id);

create trigger sa_set_updated_at
  before update on public.student_answers
  for each row execute function public.set_updated_at();

create table public.online_assessment_logs (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.online_assessments (id) on delete cascade,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action        text not null,
  detail        text,
  created_at    timestamptz not null default now()
);
create index oal_assessment_idx on public.online_assessment_logs (assessment_id);

-- -----------------------------------------------------------------------------
-- 3. Helpers de escopo
-- -----------------------------------------------------------------------------
-- Pode gerenciar/corrigir esta prova? (professor da turma OU coordenação/admin)
create or replace function public.can_manage_online_assessment(p_assessment uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.online_assessments a
     where a.id = p_assessment and public.can_manage_grades(a.class_id)
  );
$$;

-- Pode visualizar esta prova? (staff, professor da turma, aluno matriculado em
-- prova não-rascunho, ou responsável de aluno da turma)
create or replace function public.can_view_online_assessment(p_assessment uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.online_assessments a
     where a.id = p_assessment
       and (
         public.is_staff()
         or public.teaches_class(a.class_id)
         or (a.status <> 'draft' and public.is_enrolled(a.class_id))
         or (a.status <> 'draft' and exists (
               select 1 from public.class_students cs
                 join public.students s on s.id = cs.student_id
                where cs.class_id = a.class_id and public.guards_student(s.id)
            ))
       )
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
alter table public.online_assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_options enable row level security;
alter table public.student_assessment_submissions enable row level security;
alter table public.student_answers enable row level security;
alter table public.online_assessment_logs enable row level security;

-- online_assessments ----------------------------------------------------------
create policy "oa_select" on public.online_assessments
  for select to authenticated
  using (
    public.is_staff()
    or public.teaches_class(class_id)
    or (status <> 'draft' and public.is_enrolled(class_id))
    or (status <> 'draft' and exists (
          select 1 from public.class_students cs
            join public.students s on s.id = cs.student_id
           where cs.class_id = online_assessments.class_id and public.guards_student(s.id)
       ))
  );
create policy "oa_write" on public.online_assessments
  for all to authenticated
  using (public.can_manage_grades(class_id))
  with check (public.can_manage_grades(class_id));

-- assessment_questions: enunciado pode ser lido por quem vê a prova ----------
create policy "aq_select" on public.assessment_questions
  for select to authenticated
  using (public.can_view_online_assessment(assessment_id));
create policy "aq_write" on public.assessment_questions
  for all to authenticated
  using (public.can_manage_online_assessment(assessment_id))
  with check (public.can_manage_online_assessment(assessment_id));

-- assessment_options: SOMENTE gestores (contém o gabarito is_correct) ---------
-- O aluno lê alternativas sanitizadas via get_student_assessment().
create policy "ao_select" on public.assessment_options
  for select to authenticated
  using (
    exists (
      select 1 from public.assessment_questions q
       where q.id = question_id and public.can_manage_online_assessment(q.assessment_id)
    )
  );
create policy "ao_write" on public.assessment_options
  for all to authenticated
  using (
    exists (
      select 1 from public.assessment_questions q
       where q.id = question_id and public.can_manage_online_assessment(q.assessment_id)
    )
  )
  with check (
    exists (
      select 1 from public.assessment_questions q
       where q.id = question_id and public.can_manage_online_assessment(q.assessment_id)
    )
  );

-- submissions: aluno lê as próprias; responsável as do vinculado; gestor da turma
create policy "sas_select" on public.student_assessment_submissions
  for select to authenticated
  using (
    public.is_own_student(student_id)
    or public.guards_student(student_id)
    or exists (
      select 1 from public.online_assessments a
       where a.id = assessment_id
         and (public.is_staff() or public.teaches_class(a.class_id))
    )
  );
-- Escrita direta só por gestores (aluno cria/atualiza via funções DEFINER).
create policy "sas_write" on public.student_assessment_submissions
  for all to authenticated
  using (public.can_manage_online_assessment(assessment_id))
  with check (public.can_manage_online_assessment(assessment_id));

-- student_answers: leitura pelo dono/responsável/gestor; escrita só gestor -----
-- (aluno grava respostas via funções DEFINER, que ignoram a coluna grade).
create policy "sa_select" on public.student_answers
  for select to authenticated
  using (
    exists (
      select 1 from public.student_assessment_submissions sub
       where sub.id = submission_id
         and (
           public.is_own_student(sub.student_id)
           or public.guards_student(sub.student_id)
           or exists (
              select 1 from public.online_assessments a
               where a.id = sub.assessment_id
                 and (public.is_staff() or public.teaches_class(a.class_id))
           )
         )
    )
  );
create policy "sa_write" on public.student_answers
  for all to authenticated
  using (
    exists (
      select 1 from public.student_assessment_submissions sub
        join public.online_assessments a on a.id = sub.assessment_id
       where sub.id = submission_id and public.can_manage_grades(a.class_id)
    )
  )
  with check (
    exists (
      select 1 from public.student_assessment_submissions sub
        join public.online_assessments a on a.id = sub.assessment_id
       where sub.id = submission_id and public.can_manage_grades(a.class_id)
    )
  );

-- logs: leitura por gestores; inserção atribuída ao próprio ator ---------------
create policy "oal_select" on public.online_assessment_logs
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.online_assessments a
       where a.id = assessment_id and public.teaches_class(a.class_id)
    )
  );
create policy "oal_insert" on public.online_assessment_logs
  for insert to authenticated
  with check (actor_profile_id = public.current_profile_id());

-- -----------------------------------------------------------------------------
-- 5. Funções SECURITY DEFINER para o fluxo do aluno
-- -----------------------------------------------------------------------------
-- 5.1 Questões + alternativas SANITIZADAS (sem gabarito) para o player.
create or replace function public.get_student_assessment(p_assessment uuid)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_allowed boolean;
  v_result  jsonb;
begin
  select (
    public.can_manage_online_assessment(p_assessment)
    or exists (
      select 1 from public.online_assessments a
       where a.id = p_assessment and a.status <> 'draft' and public.is_enrolled(a.class_id)
    )
  ) into v_allowed;

  if not v_allowed then
    return null;
  end if;

  select coalesce(jsonb_agg(qobj order by q.order_index, q.created_at), '[]'::jsonb)
    into v_result
  from public.assessment_questions q
  cross join lateral (
    select jsonb_build_object(
      'id', q.id,
      'type', q.type,
      'statement', q.statement,
      'media_url', q.media_url,
      'points', q.points,
      'order_index', q.order_index,
      'options',
        case
          when q.type in ('multiple_choice', 'true_false') then (
            select coalesce(jsonb_agg(
                     jsonb_build_object('id', o.id, 'text', o.text, 'order_index', o.order_index)
                     order by o.order_index), '[]'::jsonb)
              from public.assessment_options o where o.question_id = q.id
          )
          when q.type = 'matching' then (
            select coalesce(jsonb_agg(
                     jsonb_build_object('id', o.id, 'left', split_part(o.text, ':::', 1), 'order_index', o.order_index)
                     order by o.order_index), '[]'::jsonb)
              from public.assessment_options o where o.question_id = q.id
          )
          else '[]'::jsonb
        end,
      'match_rights',
        case
          when q.type = 'matching' then (
            select coalesce(jsonb_agg(split_part(o.text, ':::', 2) order by random()), '[]'::jsonb)
              from public.assessment_options o where o.question_id = q.id
          )
          else null
        end
    ) as qobj
  ) lat
  where q.assessment_id = p_assessment;

  return jsonb_build_object('questions', v_result);
end;
$$;

-- 5.2 Salvar progresso / enviar tentativa (grava respostas; corrige se enviar).
-- p_answers: array de { question_id, answer_text, selected_option_id, file_url }.
create or replace function public.save_assessment_progress(
  p_submission uuid,
  p_answers    jsonb,
  p_submit     boolean
)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_sub  public.student_assessment_submissions;
  v_a    public.online_assessments;
  rec    record;
  ans    jsonb;
  v_total int;
  v_correct int;
  v_g    numeric;
begin
  select * into v_sub from public.student_assessment_submissions where id = p_submission;
  if v_sub.id is null then
    raise exception 'SUBMISSION_NAO_ENCONTRADA';
  end if;
  -- só o próprio aluno opera a tentativa
  if not public.is_own_student(v_sub.student_id) then
    raise exception 'SEM_PERMISSAO';
  end if;
  if v_sub.status <> 'in_progress' then
    raise exception 'TENTATIVA_NAO_ESTA_EM_ANDAMENTO';
  end if;

  select * into v_a from public.online_assessments where id = v_sub.assessment_id;
  -- bloqueio fora do prazo (salvo reabertura)
  if v_a.end_date is not null and now() > v_a.end_date and v_sub.reopened_at is null then
    raise exception 'PRAZO_ENCERRADO';
  end if;

  -- upsert das respostas enviadas (NUNCA grava grade vindo do cliente)
  for ans in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    insert into public.student_answers (submission_id, question_id, answer_text, selected_option_id, file_url)
    values (
      p_submission,
      (ans->>'question_id')::uuid,
      nullif(ans->>'answer_text', ''),
      nullif(ans->>'selected_option_id', '')::uuid,
      nullif(ans->>'file_url', '')
    )
    on conflict (submission_id, question_id) do update
      set answer_text        = excluded.answer_text,
          selected_option_id = excluded.selected_option_id,
          file_url           = excluded.file_url,
          updated_at         = now();
  end loop;

  if not p_submit then
    return;
  end if;

  -- ----- envio final -----
  -- correção automática das questões objetivas
  if v_a.correction_type = 'automatic' then
    for rec in
      select sa.id, sa.question_id, sa.selected_option_id, sa.answer_text, q.type, q.points
        from public.student_answers sa
        join public.assessment_questions q on q.id = sa.question_id
       where sa.submission_id = p_submission
    loop
      if rec.type in ('multiple_choice', 'true_false') then
        v_g := case
                 when rec.selected_option_id is not null
                  and exists (select 1 from public.assessment_options o
                               where o.id = rec.selected_option_id and o.is_correct)
                 then rec.points else 0 end;
        update public.student_answers set grade = v_g where id = rec.id;
      elsif rec.type = 'matching' then
        select count(*) into v_total from public.assessment_options where question_id = rec.question_id;
        v_correct := 0;
        if v_total > 0 and rec.answer_text is not null and rec.answer_text <> '' then
          declare j jsonb := rec.answer_text::jsonb;
          begin
            select count(*) into v_correct
              from public.assessment_options o
             where o.question_id = rec.question_id
               and (j ->> o.id::text) = split_part(o.text, ':::', 2);
          exception when others then
            v_correct := 0;
          end;
        end if;
        update public.student_answers
           set grade = round(rec.points * v_correct / nullif(v_total, 0), 2)
         where id = rec.id;
      else
        -- dissertativa / arquivo / imagem / vídeo: correção manual
        null;
      end if;
    end loop;
  end if;

  -- nota e status da tentativa
  if exists (select 1 from public.student_answers where submission_id = p_submission)
     and not exists (select 1 from public.student_answers where submission_id = p_submission and grade is null)
  then
    update public.student_assessment_submissions
       set status = 'graded',
           submitted_at = now(),
           grade = (select coalesce(sum(grade), 0) from public.student_answers where submission_id = p_submission)
     where id = p_submission;
  else
    update public.student_assessment_submissions
       set status = 'submitted', submitted_at = now()
     where id = p_submission;
  end if;
end;
$$;

-- 5.3 Iniciar (ou retomar) uma tentativa, respeitando janela e nº de tentativas.
create or replace function public.start_assessment(p_assessment uuid)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_student uuid;
  v_a       public.online_assessments;
  v_existing uuid;
  v_count   int;
  v_new     uuid;
begin
  select id into v_student from public.students where profile_id = public.current_profile_id();
  if v_student is null then
    raise exception 'APENAS_ALUNOS_RESPONDEM';
  end if;

  select * into v_a from public.online_assessments where id = p_assessment;
  if v_a.id is null or v_a.status <> 'published' then
    raise exception 'PROVA_INDISPONIVEL';
  end if;
  if not public.is_enrolled(v_a.class_id) then
    raise exception 'NAO_MATRICULADO';
  end if;
  if v_a.start_date is not null and now() < v_a.start_date then
    raise exception 'AINDA_NAO_INICIADA';
  end if;
  if v_a.end_date is not null and now() > v_a.end_date then
    raise exception 'PRAZO_ENCERRADO';
  end if;

  -- retoma tentativa em andamento, se houver
  select id into v_existing
    from public.student_assessment_submissions
   where assessment_id = p_assessment and student_id = v_student and status = 'in_progress'
   order by attempt_number desc limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  select count(*) into v_count
    from public.student_assessment_submissions
   where assessment_id = p_assessment and student_id = v_student;
  if v_count >= v_a.max_attempts then
    raise exception 'TENTATIVAS_ESGOTADAS';
  end if;

  insert into public.student_assessment_submissions
    (assessment_id, student_id, attempt_number, status, started_at)
  values (p_assessment, v_student, v_count + 1, 'in_progress', now())
  returning id into v_new;
  return v_new;
end;
$$;

-- 5.4 Revisão de uma tentativa: respostas do aluno + nota/feedback, e o gabarito
-- somente quando show_answer_key (ou para gestores). Para dono/responsável/gestor.
create or replace function public.get_submission_review(p_submission uuid)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_sub    public.student_assessment_submissions;
  v_a      public.online_assessments;
  v_is_mgr boolean;
  v_show   boolean;
  v_qs     jsonb;
begin
  select * into v_sub from public.student_assessment_submissions where id = p_submission;
  if v_sub.id is null then
    return null;
  end if;
  select * into v_a from public.online_assessments where id = v_sub.assessment_id;
  v_is_mgr := public.can_manage_online_assessment(v_a.id);

  if not (v_is_mgr or public.is_own_student(v_sub.student_id) or public.guards_student(v_sub.student_id)) then
    return null;
  end if;
  v_show := v_a.show_answer_key or v_is_mgr;

  select coalesce(jsonb_agg(qo order by q.order_index, q.created_at), '[]'::jsonb) into v_qs
  from public.assessment_questions q
  left join public.student_answers sa
    on sa.question_id = q.id and sa.submission_id = p_submission
  cross join lateral (
    select jsonb_build_object(
      'id', q.id, 'type', q.type, 'statement', q.statement, 'media_url', q.media_url, 'points', q.points,
      'answer_text', sa.answer_text, 'selected_option_id', sa.selected_option_id, 'file_url', sa.file_url,
      'grade', sa.grade, 'feedback', sa.feedback,
      'options',
        case
          when q.type in ('multiple_choice', 'true_false') then (
            select coalesce(jsonb_agg(
                     jsonb_build_object('id', o.id, 'text', o.text,
                       'is_correct', case when v_show then o.is_correct else null end)
                     order by o.order_index), '[]'::jsonb)
              from public.assessment_options o where o.question_id = q.id
          )
          when q.type = 'matching' then (
            select coalesce(jsonb_agg(
                     jsonb_build_object('id', o.id, 'text', split_part(o.text, ':::', 1), 'is_correct', null)
                     order by o.order_index), '[]'::jsonb)
              from public.assessment_options o where o.question_id = q.id
          )
          else '[]'::jsonb
        end,
      'match_pairs',
        case when q.type = 'matching' and v_show then (
          select coalesce(jsonb_agg(
                   jsonb_build_object('left', split_part(o.text, ':::', 1), 'right', split_part(o.text, ':::', 2))
                   order by o.order_index), '[]'::jsonb)
            from public.assessment_options o where o.question_id = q.id
        ) else null end
    ) as qo
  ) lat
  where q.assessment_id = v_a.id;

  return jsonb_build_object(
    'submission', to_jsonb(v_sub),
    'show_answer_key', v_show,
    'is_manager', v_is_mgr,
    'questions', v_qs
  );
end;
$$;

revoke all on function public.save_assessment_progress(uuid, jsonb, boolean) from public;
revoke all on function public.start_assessment(uuid) from public;
grant execute on function public.save_assessment_progress(uuid, jsonb, boolean) to authenticated;
grant execute on function public.start_assessment(uuid) to authenticated;
grant execute on function public.get_student_assessment(uuid) to authenticated;
grant execute on function public.get_submission_review(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Supabase Storage (mídia de questões e arquivos de resposta)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('assessment-files', 'assessment-files', true)
  on conflict (id) do nothing;

create policy "assessment_files_read" on storage.objects
  for select to authenticated using (bucket_id = 'assessment-files');
create policy "assessment_files_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'assessment-files');
create policy "assessment_files_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'assessment-files' and (owner = auth.uid() or public.is_staff()));
create policy "assessment_files_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'assessment-files' and (owner = auth.uid() or public.is_staff()));
