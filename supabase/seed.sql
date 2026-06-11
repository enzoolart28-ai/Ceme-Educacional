-- =============================================================================
-- Seed de desenvolvimento local — Sistema CME Educacional
-- =============================================================================
-- Cria usuários de demonstração (um por perfil), já com e-mail confirmado.
-- ATENÇÃO: uso APENAS em ambiente local. Nunca rode este seed em produção.
-- Senha padrão de todos os usuários: Senha@123
--
-- Implementado como um único bloco DO (uma só "batch") para evitar problemas
-- de divisão de statements do CLI. As funções de hash (crypt/gen_salt) vêm da
-- extensão pgcrypto, que no Supabase fica no schema `extensions`. As colunas de
-- token em auth.users precisam ser '' (não NULL), senão o GoTrue dá erro 500.
-- =============================================================================

do $$
declare
  rec       record;
  v_user_id uuid;
begin
  for rec in
    select * from (values
      ('admin@cme.local',       'Administrador',            'admin',       'active'),
      ('diretor@cme.local',     'Diretor da Escola',        'diretor',     'active'),
      ('coordenacao@cme.local', 'Coordenação Pedagógica',   'coordenacao', 'active'),
      ('secretaria@cme.local',  'Secretaria',               'secretaria',  'active'),
      ('financeiro@cme.local',  'Setor Financeiro',         'financeiro',  'active'),
      ('professor@cme.local',   'Professor Demonstração',   'professor',   'active'),
      ('aluno@cme.local',       'Aluno Demonstração',       'aluno',       'active'),
      ('responsavel@cme.local', 'Responsável Demonstração', 'responsavel', 'active'),
      -- Usuário inativo para testar o bloqueio de acesso:
      ('inativo@cme.local',     'Usuário Inativo',          'aluno',       'inactive')
    ) as t(email, full_name, role, status)
  loop
    if exists (select 1 from auth.users where email = rec.email) then
      continue;
    end if;

    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token,
      reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', rec.email,
      extensions.crypt('Senha@123', extensions.gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', rec.full_name, 'role', rec.role),
      false, false,
      '', '', '', '',
      '', '', '',
      ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      v_user_id, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', rec.email),
      'email', now(), now(), now()
    );

    -- O trigger handle_new_user cria o profile; ajustamos role/status/nome.
    update public.profiles
       set role = rec.role::public.user_role,
           status = rec.status::public.user_status,
           full_name = rec.full_name
     where user_id = v_user_id;
  end loop;
end $$;

-- =============================================================================
-- Seed acadêmico (dados de exemplo REAIS nas tabelas do módulo Acadêmico)
-- =============================================================================
do $$
declare
  c_fund  uuid;
  c_medio uuid;
  s_mat   uuid;
  t_1a    uuid;
  t_2a    uuid;
  t_3b    uuid;
  u_main  uuid;
  p_aluno uuid;
  p_prof  uuid;
  p_resp  uuid;
begin
  -- Só semeia se ainda não há cursos (evita duplicar em re-execuções).
  if exists (select 1 from public.courses) then
    return;
  end if;

  insert into public.units (name) values ('Unidade Central') returning id into u_main;

  insert into public.courses
    (name, description, modality, type, workload_hours, duration, status,
     certificate_enabled, minimum_attendance, minimum_grade)
  values
    ('Ensino Fundamental', 'Do 1º ao 9º ano', 'presencial', 'livre', 800, '9 anos',
     'active', true, 75, 6.00)
  returning id into c_fund;

  insert into public.courses
    (name, description, modality, type, workload_hours, duration, status,
     certificate_enabled, minimum_attendance, minimum_grade)
  values
    ('Ensino Médio', '1ª a 3ª série', 'presencial', 'livre', 800, '3 anos',
     'active', true, 75, 6.00)
  returning id into c_medio;

  -- Cursos adicionais para demonstrar modalidades/tipos/status nos filtros.
  insert into public.courses
    (name, description, modality, type, workload_hours, duration, price, status,
     certificate_enabled, minimum_attendance, minimum_grade, requirements)
  values
    ('Técnico em Informática', 'Formação técnica em TI', 'ead', 'tecnico', 1200,
     '18 meses', 4800.00, 'active', true, 75, 6.00, 'Ensino Médio completo'),
    ('Preparatório ENEM', 'Preparação para o ENEM', 'semipresencial', 'preparatorio',
     300, '8 meses', 1200.00, 'planning', false, 70, 5.00, null),
    ('Reforço de Matemática', 'Reforço escolar de Matemática', 'presencial', 'reforco',
     60, '3 meses', 400.00, 'active', false, 60, null, null);

  insert into public.subjects (name, code) values ('Matemática', 'MAT') returning id into s_mat;
  insert into public.subjects (name, code) values ('Português', 'POR');
  insert into public.subjects (name, code) values ('História', 'HIS');
  insert into public.subjects (name, code) values ('Geografia', 'GEO');
  insert into public.subjects (name, code) values ('Biologia', 'BIO');
  insert into public.subjects (name, code) values ('Física', 'FIS');

  -- Disciplinas e módulos do Ensino Médio.
  insert into public.course_subjects (course_id, subject_id)
    select c_medio, id from public.subjects;
  insert into public.course_modules (course_id, name, description, order_index, workload_hours)
  values
    (c_medio, '1ª série', 'Módulo da 1ª série', 1, 260),
    (c_medio, '2ª série', 'Módulo da 2ª série', 2, 260),
    (c_medio, '3ª série', 'Módulo da 3ª série', 3, 280);

  insert into public.classes
    (name, course_id, year, shift, unit_id, status, max_students,
     start_date, end_date, weekdays, start_time, end_time)
  values ('1º Ano A', c_medio, 2026, 'manha', u_main, 'open', 40,
     '2026-02-01', '2026-12-15', array['seg','ter','qua','qui','sex'], '07:30', '12:00')
  returning id into t_1a;
  insert into public.classes
    (name, course_id, year, shift, unit_id, status, max_students,
     start_date, end_date, weekdays, start_time, end_time)
  values ('2º Ano A', c_medio, 2026, 'manha', u_main, 'in_progress', 35,
     '2026-02-01', '2026-12-15', array['seg','ter','qua','qui','sex'], '07:30', '12:00')
  returning id into t_2a;
  insert into public.classes
    (name, course_id, year, shift, unit_id, status, max_students,
     start_date, end_date, weekdays, start_time, end_time)
  values ('3º Ano B', c_medio, 2026, 'tarde', u_main, 'open', 30,
     '2026-02-01', '2026-12-15', array['seg','qua','sex'], '13:30', '17:30')
  returning id into t_3b;

  select id into p_aluno from public.profiles where email = 'aluno@cme.local';
  select id into p_prof  from public.profiles where email = 'professor@cme.local';
  select id into p_resp  from public.profiles where email = 'responsavel@cme.local';

  -- Matrícula do aluno demo na turma 2º Ano A.
  if p_aluno is not null then
    insert into public.enrollments (student_id, class_id) values (p_aluno, t_2a);
  end if;

  -- Professor demo leciona Matemática em duas turmas.
  if p_prof is not null then
    insert into public.teacher_assignments (teacher_id, class_id, subject_id)
      values (p_prof, t_2a, s_mat), (p_prof, t_3b, s_mat);
  end if;

  -- (O vínculo responsável↔aluno é semeado no bloco de guardians, mais abaixo.)
end $$;

-- =============================================================================
-- Seed de alunos (cadastro completo) — dados de exemplo REAIS
-- =============================================================================
do $$
declare
  p_aluno uuid;
begin
  if exists (select 1 from public.students) then
    return;
  end if;

  select id into p_aluno from public.profiles where email = 'aluno@cme.local';

  -- Aluno com conta de login (vinculado ao profile demo).
  insert into public.students
    (profile_id, full_name, cpf, rg, birth_date, phone, email, address, city, state, mother_name, father_name, status)
  values
    (p_aluno, 'Aluno Demonstração', '11144477735', 'MG-12.345.678', '2009-03-12',
     '(31) 98888-0001', 'aluno@cme.local', 'Rua das Flores, 100', 'Belo Horizonte', 'MG',
     'Maria Demonstração', 'José Demonstração', 'active');

  -- Alunos avulsos (sem login) com status variados para listagem/filtros.
  insert into public.students
    (full_name, cpf, birth_date, phone, email, city, state, mother_name, status)
  values
    ('Maria Oliveira',  '52998224725', '2010-07-22', '(31) 97777-0002', 'maria.o@exemplo.com', 'Contagem', 'MG', 'Joana Oliveira', 'active'),
    ('João Pereira',    '15350946056', '2008-11-05', '(31) 97777-0003', 'joao.p@exemplo.com',  'Belo Horizonte', 'MG', 'Ana Pereira', 'defaulter'),
    ('Lucas Martins',   '11122233396', '2011-01-30', '(31) 97777-0004', 'lucas.m@exemplo.com', 'Betim', 'MG', 'Rita Martins', 'locked'),
    ('Sofia Ramos',     '39053344705', '2009-09-18', '(31) 97777-0005', 'sofia.r@exemplo.com', 'Belo Horizonte', 'MG', 'Clara Ramos', 'transferred'),
    ('Pedro Henrique',  '20503372060', '2012-05-02', '(31) 97777-0006', 'pedro.h@exemplo.com', 'Nova Lima', 'MG', 'Lúcia Henrique', 'active');
end $$;

-- =============================================================================
-- Seed de responsáveis (guardians) e vínculos
-- =============================================================================
do $$
declare
  p_resp  uuid;
  g_resp  uuid;
  s_aluno uuid;
begin
  if exists (select 1 from public.guardians) then
    return;
  end if;

  select id into p_resp from public.profiles where email = 'responsavel@cme.local';
  select id into s_aluno from public.students where cpf = '11144477735';

  -- Responsável com conta de login (acesso ao painel próprio).
  insert into public.guardians (profile_id, full_name, cpf, phone, email, city, state, kinship)
  values (p_resp, 'Responsável Demonstração', '38644197089', '(31) 98888-9999',
          'responsavel@cme.local', 'Belo Horizonte', 'MG', 'Mãe')
  returning id into g_resp;

  -- Vínculo com o aluno demo (financeiro + pedagógico).
  if s_aluno is not null then
    insert into public.student_guardians
      (student_id, guardian_id, is_financial_responsible, is_pedagogical_responsible)
    values (s_aluno, g_resp, true, true);
  end if;

  -- Responsável avulso (sem login) para a listagem.
  insert into public.guardians (full_name, cpf, phone, email, city, state, kinship)
  values ('Carlos Pereira', '85277484000', '(31) 97777-1234', 'carlos.p@exemplo.com',
          'Contagem', 'MG', 'Pai');
end $$;

-- =============================================================================
-- Seed de professores (teachers) e vínculos
-- =============================================================================
do $$
declare
  p_prof uuid;
  t_prof uuid;
  s_mat  uuid;
  c_2a   uuid;
  c_3b   uuid;
begin
  if exists (select 1 from public.teachers) then
    return;
  end if;

  select id into p_prof from public.profiles where email = 'professor@cme.local';
  select id into s_mat  from public.subjects where code = 'MAT';
  select id into c_2a   from public.classes where name = '2º Ano A' and year = 2026;
  select id into c_3b   from public.classes where name = '3º Ano B' and year = 2026;

  insert into public.teachers
    (profile_id, full_name, cpf, phone, email, education, expertise_area, workload, status)
  values
    (p_prof, 'Professor Demonstração', '17822869036', '(31) 98888-2222',
     'professor@cme.local', 'Licenciatura em Matemática', 'Exatas', 20, 'active')
  returning id into t_prof;

  if s_mat is not null then
    insert into public.teacher_subjects (teacher_id, subject_id) values (t_prof, s_mat);
  end if;
  if c_2a is not null then
    insert into public.teacher_classes (teacher_id, class_id) values (t_prof, c_2a);
  end if;
  if c_3b is not null then
    insert into public.teacher_classes (teacher_id, class_id) values (t_prof, c_3b);
  end if;

  -- Professor responsável pelas turmas que leciona.
  update public.classes set main_teacher_id = t_prof where id in (c_2a, c_3b);

  -- Professor avulso (sem login) para a listagem.
  insert into public.teachers
    (full_name, cpf, email, education, expertise_area, workload, status)
  values
    ('Helena Souza', '63897935074', 'helena.s@exemplo.com',
     'Mestrado em Letras', 'Linguagens', 16, 'active');
end $$;

-- =============================================================================
-- Seed do roster de turma (class_students) — aluno demo na 2º Ano A
-- =============================================================================
do $$
declare
  v_class    uuid;
  v_student  uuid;
  v_profile  uuid;
  v_enroll   uuid;
begin
  if exists (select 1 from public.class_students) then
    return;
  end if;

  select id into v_class from public.classes where name = '2º Ano A' and year = 2026;
  select id, profile_id into v_student, v_profile
    from public.students where cpf = '11144477735';

  if v_class is not null and v_student is not null then
    if v_profile is not null then
      select id into v_enroll from public.enrollments
        where student_id = v_profile and class_id = v_class limit 1;
    end if;
    insert into public.class_students (class_id, student_id, enrollment_id, status)
      values (v_class, v_student, v_enroll, 'active');
  end if;
end $$;

-- =============================================================================
-- Seed de chamadas (attendance) — 5 sessões da 2º Ano A (dispara alertas)
-- =============================================================================
do $$
declare
  v_class   uuid;
  v_subject uuid;
  v_teacher uuid;
  v_student uuid;
  v_att     uuid;
  dts  date[] := array['2026-02-02','2026-02-04','2026-02-06','2026-02-09','2026-02-11'];
  sts  text[] := array['present','absent','absent','absent','present'];
  i int;
begin
  if exists (select 1 from public.attendance) then
    return;
  end if;

  select id into v_class   from public.classes  where name = '2º Ano A' and year = 2026;
  select id into v_subject from public.subjects where code = 'MAT';
  select id into v_teacher from public.teachers where email = 'professor@cme.local';
  select id into v_student from public.students where cpf = '11144477735';
  if v_class is null or v_student is null then
    return;
  end if;

  for i in 1 .. array_length(dts, 1) loop
    insert into public.attendance (class_id, subject_id, teacher_id, date, start_time, end_time, status)
      values (v_class, v_subject, v_teacher, dts[i], '07:30', '08:20', 'finalized')
      returning id into v_att;
    insert into public.attendance_records (attendance_id, student_id, status)
      values (v_att, v_student, sts[i]::public.attendance_record_status);
  end loop;
end $$;

-- =============================================================================
-- Seed de avaliações e notas — 2º Ano A / Matemática
-- =============================================================================
do $$
declare
  v_class   uuid;
  v_subject uuid;
  v_teacher uuid;
  v_course  uuid;
  v_student uuid;
  a1 uuid;
  a2 uuid;
begin
  if exists (select 1 from public.assessments) then
    return;
  end if;

  select id, course_id into v_class, v_course from public.classes where name = '2º Ano A' and year = 2026;
  select id into v_subject from public.subjects where code = 'MAT';
  select id into v_teacher from public.teachers where email = 'professor@cme.local';
  select id into v_student from public.students where cpf = '11144477735';
  if v_class is null then
    return;
  end if;

  insert into public.assessments (name, type, course_id, class_id, subject_id, teacher_id, weight, max_grade, date)
    values ('Prova 1', 'prova', v_course, v_class, v_subject, v_teacher, 2, 10, '2026-03-15')
    returning id into a1;
  insert into public.assessments (name, type, course_id, class_id, subject_id, teacher_id, weight, max_grade, date)
    values ('Trabalho 1', 'trabalho', v_course, v_class, v_subject, v_teacher, 1, 10, '2026-03-20')
    returning id into a2;

  if v_student is not null then
    insert into public.grades (assessment_id, student_id, grade)
      values (a1, v_student, 7.0), (a2, v_student, 8.0);
  end if;
end $$;

-- =============================================================================
-- Seed do AVA — aulas, materiais e progresso (Ensino Médio)
-- =============================================================================
do $$
declare
  v_course  uuid;
  v_module  uuid;
  v_subject uuid;
  v_student uuid;
  l1 uuid;
  l2 uuid;
  l3 uuid;
begin
  if exists (select 1 from public.lessons) then
    return;
  end if;

  select id into v_course from public.courses where name = 'Ensino Médio';
  select id into v_module from public.course_modules where course_id = v_course order by order_index limit 1;
  select id into v_subject from public.subjects where code = 'MAT';
  select id into v_student from public.students where cpf = '11144477735';
  if v_course is null then
    return;
  end if;

  insert into public.lessons (course_id, module_id, subject_id, title, description, video_url, release_type, order_index, status)
    values (v_course, v_module, v_subject, 'Aula 1 — Introdução', 'Boas-vindas e visão geral do curso.',
            'https://www.youtube.com/embed/aqz-KE-bpKQ', 'all', 1, 'published')
    returning id into l1;
  insert into public.lessons (course_id, module_id, subject_id, title, description, video_url, release_type, order_index, status)
    values (v_course, v_module, v_subject, 'Aula 2 — Funções', 'Conceitos de funções.',
            'https://www.youtube.com/embed/aqz-KE-bpKQ', 'after_previous', 2, 'published')
    returning id into l2;
  insert into public.lessons (course_id, module_id, subject_id, title, description, release_type, release_date, order_index, status)
    values (v_course, v_module, v_subject, 'Aula 3 — Avançado', 'Conteúdo avançado (libera por data).',
            'date', '2026-12-01', 3, 'published')
    returning id into l3;

  insert into public.lesson_materials (lesson_id, title, type, external_url)
    values (l1, 'Apostila (PDF)', 'pdf', 'https://example.com/apostila.pdf'),
           (l1, 'Material complementar', 'link', 'https://example.com/extra');

  if v_student is not null then
    insert into public.student_lesson_progress (student_id, lesson_id, status, completed_at, progress_percentage)
      values (v_student, l1, 'completed', now(), 100);
  end if;
end $$;

-- =============================================================================
-- Seed de Provas Online — prova de exemplo (2º Ano A / Matemática)
-- =============================================================================
do $$
declare
  v_class   uuid;
  v_course  uuid;
  v_subject uuid;
  v_teacher uuid;
  v_assess  uuid;
  q1 uuid; q2 uuid; q3 uuid; q4 uuid;
begin
  if exists (select 1 from public.online_assessments) then
    return;
  end if;

  select id, course_id into v_class, v_course from public.classes where name = '2º Ano A' and year = 2026;
  select id into v_subject from public.subjects where code = 'MAT';
  select id into v_teacher from public.teachers where email = 'professor@cme.local';
  if v_class is null then
    return;
  end if;

  insert into public.online_assessments
    (title, description, course_id, class_id, subject_id, teacher_id, start_date, end_date,
     time_limit_minutes, max_attempts, max_grade, min_grade, correction_type,
     show_answer_key, shuffle_questions, shuffle_options, status)
  values
    ('Prova Online — Matemática Básica',
     'Avaliação com correção automática das questões objetivas e correção manual da dissertativa.',
     v_course, v_class, v_subject, v_teacher,
     '2026-01-01 00:00:00-03', '2026-12-31 23:59:00-03',
     30, 2, 10, 6, 'automatic', true, false, false, 'published')
  returning id into v_assess;

  -- Q1 — múltipla escolha (4 pts)
  insert into public.assessment_questions (assessment_id, type, statement, points, order_index)
    values (v_assess, 'multiple_choice', 'Quanto é 2 + 2?', 4, 1) returning id into q1;
  insert into public.assessment_options (question_id, text, is_correct, order_index) values
    (q1, '3', false, 1), (q1, '4', true, 2), (q1, '5', false, 3), (q1, '22', false, 4);

  -- Q2 — verdadeiro ou falso (2 pts)
  insert into public.assessment_questions (assessment_id, type, statement, points, order_index)
    values (v_assess, 'true_false', 'O número 7 é primo.', 2, 2) returning id into q2;
  insert into public.assessment_options (question_id, text, is_correct, order_index) values
    (q2, 'Verdadeiro', true, 1), (q2, 'Falso', false, 2);

  -- Q3 — associação de colunas (2 pts) — texto guarda "esquerda:::direita"
  insert into public.assessment_questions (assessment_id, type, statement, points, order_index)
    values (v_assess, 'matching', 'Associe cada país à sua capital.', 2, 3) returning id into q3;
  insert into public.assessment_options (question_id, text, is_correct, order_index) values
    (q3, 'Brasil:::Brasília', true, 1),
    (q3, 'Argentina:::Buenos Aires', true, 2),
    (q3, 'Chile:::Santiago', true, 3);

  -- Q4 — dissertativa (2 pts) — correção manual
  insert into public.assessment_questions (assessment_id, type, statement, points, order_index)
    values (v_assess, 'essay', 'Explique, com suas palavras, o que é uma função matemática.', 2, 4)
    returning id into q4;
end $$;

-- =============================================================================
-- Seed Financeiro — plano, cobranças e pagamentos de exemplo
-- =============================================================================
do $$
declare
  v_course uuid;
  v_class uuid;
  v_student uuid;
  v_enrollment uuid;
  v_receiver uuid;
  v_plan uuid;
  v_invoice_paid uuid;
  v_invoice_partial uuid;
begin
  if exists (select 1 from public.financial_plans) then
    return;
  end if;

  select id into v_course from public.courses where name = 'Ensino Médio';
  select id into v_class from public.classes where name = '2º Ano A' and year = 2026;
  select id into v_student from public.students where cpf = '11144477735';
  select id into v_receiver from public.profiles where email = 'financeiro@cme.local';
  select id into v_enrollment
    from public.class_students
   where class_id = v_class and student_id = v_student
   limit 1;

  if v_course is null or v_class is null or v_student is null then
    return;
  end if;

  insert into public.financial_plans (
    name,
    course_id,
    total_value,
    installments,
    due_day,
    discount_value,
    scholarship_percentage,
    notes
  ) values (
    'Plano Ensino Médio 2026',
    v_course,
    7800,
    12,
    10,
    0,
    10,
    'Plano anual com bolsa de demonstração.'
  ) returning id into v_plan;

  insert into public.invoices (
    student_id,
    plan_id,
    enrollment_id,
    course_id,
    class_id,
    original_value,
    discount_value,
    fine_value,
    interest_value,
    due_date,
    status,
    notes
  ) values (
    v_student,
    v_plan,
    v_enrollment,
    v_course,
    v_class,
    650,
    65,
    10,
    5,
    '2026-04-10',
    'overdue',
    'Mensalidade vencida de demonstração.'
  );

  insert into public.invoices (
    student_id,
    plan_id,
    enrollment_id,
    course_id,
    class_id,
    original_value,
    discount_value,
    due_date,
    status,
    notes
  ) values (
    v_student,
    v_plan,
    v_enrollment,
    v_course,
    v_class,
    650,
    65,
    '2026-05-10',
    'open',
    'Mensalidade quitada de demonstração.'
  ) returning id into v_invoice_paid;

  insert into public.payments (invoice_id, amount, payment_method, paid_at, received_by, notes)
    values (v_invoice_paid, 585, 'pix', '2026-05-08 10:00:00-03', v_receiver, 'Pagamento integral via Pix.');

  insert into public.invoices (
    student_id,
    plan_id,
    enrollment_id,
    course_id,
    class_id,
    original_value,
    discount_value,
    due_date,
    status,
    notes
  ) values (
    v_student,
    v_plan,
    v_enrollment,
    v_course,
    v_class,
    650,
    65,
    '2026-06-10',
    'open',
    'Mensalidade com pagamento parcial.'
  ) returning id into v_invoice_partial;

  insert into public.payments (invoice_id, amount, payment_method, paid_at, received_by, notes)
    values (v_invoice_partial, 300, 'credit_card', '2026-06-05 15:30:00-03', v_receiver, 'Pagamento parcial.');
end $$;

-- =============================================================================
-- Seed de Documentos — documentos do aluno demo (2º Ano A)
-- =============================================================================
do $$
declare
  v_student uuid;
  v_secretaria uuid;
  v_admin uuid;
  v_enroll uuid;
begin
  if exists (select 1 from public.documents) then
    return;
  end if;

  select id into v_student from public.students where cpf = '11144477735';
  if v_student is null then
    return;
  end if;
  select p.id into v_secretaria from public.profiles p join auth.users u on u.id = p.user_id where u.email = 'secretaria@cme.local';
  select p.id into v_admin from public.profiles p join auth.users u on u.id = p.user_id where u.email = 'admin@cme.local';
  select e.id into v_enroll from public.enrollments e where e.student_id = (
    select profile_id from public.students where id = v_student
  ) limit 1;

  insert into public.documents (student_id, type, title, file_url, status, observation, reviewed_by, reviewed_at) values
    (v_student, 'rg', 'RG (frente e verso)', 'seed/rg.pdf', 'enviado', null, null, null),
    (v_student, 'comprovante_residencia', 'Comprovante de residência', 'seed/comprovante.pdf', 'aprovado',
       'Documento conferido.', v_secretaria, now()),
    (v_student, 'historico_escolar', 'Histórico escolar (ano anterior)', null, 'pendente', null, null, null);

  insert into public.generated_documents (student_id, enrollment_id, type, title, file_url, generated_by)
    values (v_student, v_enroll, 'declaracao_matricula', 'Declaração de Matrícula', 'seed/declaracao.pdf', v_admin);
end $$;
