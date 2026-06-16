-- =============================================================================
-- Migration: Relatório Avaliativo de Aula-Teste (seleção de professores)
-- Sistema CME Educacional
-- =============================================================================
-- Permite avaliar candidatos a professor durante uma aula-teste, reunindo as
-- perspectivas de comissão, professor atual, alunos e responsáveis, calculando
-- notas ponderadas e gerando um relatório profissional e editável.
--
-- Convenção: tabelas com prefixo at_ (aula-teste). O catálogo de critérios e as
-- configurações padrão são semeados AQUI (migration) para existirem também em
-- produção; dados de demonstração ficam no seed.sql (apenas local).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.at_report_status as enum ('rascunho', 'finalizado', 'reaberto');

create type public.at_process_status as enum (
  'em_andamento',
  'pendente_documentacao',
  'pendente_nova_aula',
  'encaminhado',
  'finalizado'
);

create type public.at_evaluation_type as enum (
  'curricular',
  'plano_aula',
  'didatica',
  'dominio',
  'professor_atual',
  'comissao'
);

create type public.at_attachment_kind as enum ('curriculo', 'plano_aula', 'assinatura', 'outro');

create type public.at_signature_role as enum (
  'candidato',
  'professor_atual',
  'coordenador',
  'avaliador',
  'responsavel_processo'
);

create type public.at_teaching_modality as enum ('presencial', 'remota', 'hibrida');

-- -----------------------------------------------------------------------------
-- 2. Permissões
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('aulateste.manage',   'Gerenciar aula-teste',  'Cadastrar candidatos, montar e finalizar relatórios de aula-teste.'),
  ('aulateste.evaluate', 'Avaliar aula-teste',    'Preencher a avaliação da aula-teste destinada ao usuário.')
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('diretor',     'aulateste.manage'),
  ('coordenacao', 'aulateste.manage'),
  ('coordenacao', 'aulateste.evaluate'),
  ('professor',   'aulateste.evaluate')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Helpers
-- -----------------------------------------------------------------------------
create or replace function public.can_manage_aulateste()
returns boolean language sql stable security definer set search_path = public
as $$ select public.has_permission('aulateste.manage'); $$;
-- (is_aulateste_evaluator é definido após a tabela at_evaluations existir.)

-- -----------------------------------------------------------------------------
-- 4. Configurações (cabeçalho institucional + pesos padrão) — linha única
-- -----------------------------------------------------------------------------
create table public.at_settings (
  id               boolean primary key default true,
  institution_name text not null default 'Instituição de Ensino',
  cnpj             text,
  address          text,
  phone            text,
  email            text,
  sector           text,
  logo_path        text,
  default_weights  jsonb not null default
    '{"curricular":15,"plano_aula":15,"didatica":25,"dominio":20,"professor_atual":10,"alunos":10,"pais":5}'::jsonb,
  updated_by       uuid references public.profiles (id) on delete set null,
  updated_at       timestamptz not null default now(),
  constraint at_settings_singleton check (id)
);

insert into public.at_settings (id) values (true) on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 5. Candidatos
-- -----------------------------------------------------------------------------
create table public.at_candidates (
  id                      uuid primary key default gen_random_uuid(),
  full_name               text not null,
  cpf                     text,
  birth_date              date,
  phone                   text,
  email                   text,
  address                 text,
  academic_background     text,
  postgrad                text,
  complementary_courses   text,
  professional_experience text,
  teaching_experience     text,
  disciplines             text,
  availability            text,
  observations            text,
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index at_candidates_name_idx on public.at_candidates (full_name);

create trigger at_candidates_set_updated_at
  before update on public.at_candidates
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. Relatório
-- -----------------------------------------------------------------------------
create table public.at_reports (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  candidate_id       uuid not null references public.at_candidates (id) on delete cascade,
  -- Vaga
  position_title     text,
  unit_id            uuid references public.units (id) on delete set null,
  modality           text,                       -- modalidade de ensino da vaga
  discipline         text,
  -- Aula-teste
  test_date          date,
  start_time         time,
  end_time           time,
  duration_minutes   int,
  class_id           uuid references public.classes (id) on delete set null,
  age_group          text,
  students_present   int,
  theme              text,
  content            text,
  test_modality      public.at_teaching_modality,
  location           text,
  available_resources text,
  used_resources     text,
  evaluators_present text,
  -- Currículo
  resume_summary     text,
  resume_notes       text,
  resume_sent_at     date,
  -- Plano de aula (campos livres agrupados) e parecer final
  lesson_plan        jsonb not null default '{}'::jsonb,
  final_opinion      jsonb not null default '{}'::jsonb,
  -- Pontuação (snapshot dos pesos + notas calculadas)
  weights            jsonb not null default
    '{"curricular":15,"plano_aula":15,"didatica":25,"dominio":20,"professor_atual":10,"alunos":10,"pais":5}'::jsonb,
  section_scores     jsonb not null default '{}'::jsonb,
  final_score        numeric(5, 2),
  -- Estado
  status             public.at_report_status not null default 'rascunho',
  process_status     public.at_process_status not null default 'em_andamento',
  wizard_step        int not null default 1,
  notes              text,
  created_by         uuid references public.profiles (id) on delete set null,
  finalized_by       uuid references public.profiles (id) on delete set null,
  finalized_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index at_reports_candidate_idx on public.at_reports (candidate_id);
create index at_reports_status_idx on public.at_reports (status);
create index at_reports_process_idx on public.at_reports (process_status);
create index at_reports_unit_idx on public.at_reports (unit_id);

create trigger at_reports_set_updated_at
  before update on public.at_reports
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Catálogo de critérios (configurável) — section = tipo de avaliação
-- -----------------------------------------------------------------------------
create table public.at_criteria (
  id          uuid primary key default gen_random_uuid(),
  section     public.at_evaluation_type not null,
  label       text not null,
  order_index int not null default 0,
  active      boolean not null default true,
  unique (section, order_index)
);
create index at_criteria_section_idx on public.at_criteria (section);

-- -----------------------------------------------------------------------------
-- 8. Avaliações (uma por seção/avaliador) + notas por critério
-- -----------------------------------------------------------------------------
create table public.at_evaluations (
  id                   uuid primary key default gen_random_uuid(),
  report_id            uuid not null references public.at_reports (id) on delete cascade,
  type                 public.at_evaluation_type not null,
  evaluator_profile_id uuid references public.profiles (id) on delete set null,
  evaluator_name       text,
  evaluator_role       text,
  parecer              text,
  signature_path       text,
  score                numeric(5, 2),  -- nota da seção (0–10) calculada
  created_by           uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index at_evaluations_report_idx on public.at_evaluations (report_id);
create index at_evaluations_evaluator_idx on public.at_evaluations (evaluator_profile_id);

create trigger at_evaluations_set_updated_at
  before update on public.at_evaluations
  for each row execute function public.set_updated_at();

create table public.at_evaluation_scores (
  id            uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.at_evaluations (id) on delete cascade,
  criterion_id  uuid not null references public.at_criteria (id) on delete cascade,
  score         int,                              -- 1..5 (null se não avaliado)
  comment       text,
  not_evaluated boolean not null default false,
  unique (evaluation_id, criterion_id),
  constraint at_eval_scores_range check (score is null or score between 1 and 5)
);
create index at_evaluation_scores_eval_idx on public.at_evaluation_scores (evaluation_id);

-- Avaliador designado para um relatório (tem uma avaliação atribuída a si).
create or replace function public.is_aulateste_evaluator(p_report uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.at_evaluations e
     where e.report_id = p_report
       and e.evaluator_profile_id = public.current_profile_id()
  );
$$;

-- -----------------------------------------------------------------------------
-- 9. Respostas de alunos e responsáveis
-- -----------------------------------------------------------------------------
create table public.at_student_responses (
  id                   uuid primary key default gen_random_uuid(),
  report_id            uuid not null references public.at_reports (id) on delete cascade,
  respondent_profile_id uuid references public.profiles (id) on delete set null,
  is_child             boolean not null default false,
  overall_rating       numeric(4, 2),            -- 1..5 (ou 1..3 carinhas)
  recommend            boolean,
  positive_point       text,
  improvement_point    text,
  answers              jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now()
);
create index at_student_responses_report_idx on public.at_student_responses (report_id);

create table public.at_guardian_responses (
  id                    uuid primary key default gen_random_uuid(),
  report_id             uuid not null references public.at_reports (id) on delete cascade,
  respondent_profile_id uuid references public.profiles (id) on delete set null,
  guardian_name         text,
  student_name          text,
  kinship               text,
  overall_rating        numeric(4, 2),
  comment               text,
  authorized            boolean not null default true,
  answers               jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);
create index at_guardian_responses_report_idx on public.at_guardian_responses (report_id);

-- -----------------------------------------------------------------------------
-- 10. Anexos, assinaturas e logs
-- -----------------------------------------------------------------------------
create table public.at_attachments (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.at_reports (id) on delete cascade,
  kind        public.at_attachment_kind not null default 'outro',
  file_path   text not null,                      -- caminho no Storage
  file_name   text not null,
  mime_type   text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index at_attachments_report_idx on public.at_attachments (report_id);

create table public.at_signatures (
  id             uuid primary key default gen_random_uuid(),
  report_id      uuid not null references public.at_reports (id) on delete cascade,
  role           public.at_signature_role not null,
  name           text,
  position       text,
  signature_path text,
  signed_at      timestamptz,
  created_at     timestamptz not null default now()
);
create index at_signatures_report_idx on public.at_signatures (report_id);

create table public.at_logs (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid references public.at_reports (id) on delete cascade,
  actor_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  detail     text,
  created_at timestamptz not null default now()
);
create index at_logs_report_idx on public.at_logs (report_id);

-- -----------------------------------------------------------------------------
-- 11. RLS
-- -----------------------------------------------------------------------------
alter table public.at_settings enable row level security;
alter table public.at_candidates enable row level security;
alter table public.at_reports enable row level security;
alter table public.at_criteria enable row level security;
alter table public.at_evaluations enable row level security;
alter table public.at_evaluation_scores enable row level security;
alter table public.at_student_responses enable row level security;
alter table public.at_guardian_responses enable row level security;
alter table public.at_attachments enable row level security;
alter table public.at_signatures enable row level security;
alter table public.at_logs enable row level security;

-- Configurações: todos autenticados leem (cabeçalho do relatório); só gestão grava.
create policy "at_settings_select" on public.at_settings
  for select to authenticated using (true);
create policy "at_settings_write" on public.at_settings
  for all to authenticated
  using (public.can_manage_aulateste()) with check (public.can_manage_aulateste());

-- Critérios: autenticados leem (renderizar formulários); gestão grava.
create policy "at_criteria_select" on public.at_criteria
  for select to authenticated using (true);
create policy "at_criteria_write" on public.at_criteria
  for all to authenticated
  using (public.can_manage_aulateste()) with check (public.can_manage_aulateste());

-- Candidatos: só gestão (protege CPF/endereço).
create policy "at_candidates_all" on public.at_candidates
  for all to authenticated
  using (public.can_manage_aulateste()) with check (public.can_manage_aulateste());

-- Relatórios: gestão tudo; avaliador designado lê.
create policy "at_reports_select" on public.at_reports
  for select to authenticated
  using (public.can_manage_aulateste() or public.is_aulateste_evaluator(id));
create policy "at_reports_insert" on public.at_reports
  for insert to authenticated with check (public.can_manage_aulateste());
create policy "at_reports_update" on public.at_reports
  for update to authenticated
  using (public.can_manage_aulateste()) with check (public.can_manage_aulateste());
create policy "at_reports_delete" on public.at_reports
  for delete to authenticated using (public.can_manage_aulateste());

-- Avaliações: gestão tudo; avaliador lê/grava a própria.
create policy "at_evaluations_select" on public.at_evaluations
  for select to authenticated
  using (public.can_manage_aulateste() or evaluator_profile_id = public.current_profile_id());
create policy "at_evaluations_insert" on public.at_evaluations
  for insert to authenticated
  with check (
    public.can_manage_aulateste()
    or (public.has_permission('aulateste.evaluate') and evaluator_profile_id = public.current_profile_id())
  );
create policy "at_evaluations_update" on public.at_evaluations
  for update to authenticated
  using (public.can_manage_aulateste() or evaluator_profile_id = public.current_profile_id())
  with check (public.can_manage_aulateste() or evaluator_profile_id = public.current_profile_id());
create policy "at_evaluations_delete" on public.at_evaluations
  for delete to authenticated using (public.can_manage_aulateste());

-- Notas por critério: seguem a avaliação-mãe.
create policy "at_evaluation_scores_select" on public.at_evaluation_scores
  for select to authenticated
  using (exists (
    select 1 from public.at_evaluations e
     where e.id = evaluation_id
       and (public.can_manage_aulateste() or e.evaluator_profile_id = public.current_profile_id())
  ));
create policy "at_evaluation_scores_write" on public.at_evaluation_scores
  for all to authenticated
  using (exists (
    select 1 from public.at_evaluations e
     where e.id = evaluation_id
       and (public.can_manage_aulateste() or e.evaluator_profile_id = public.current_profile_id())
  ))
  with check (exists (
    select 1 from public.at_evaluations e
     where e.id = evaluation_id
       and (public.can_manage_aulateste() or e.evaluator_profile_id = public.current_profile_id())
  ));

-- Respostas de alunos: gestão lê; aluno cria/edita a própria.
create policy "at_student_responses_select" on public.at_student_responses
  for select to authenticated
  using (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id());
create policy "at_student_responses_insert" on public.at_student_responses
  for insert to authenticated
  with check (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id());
create policy "at_student_responses_update" on public.at_student_responses
  for update to authenticated
  using (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id())
  with check (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id());
create policy "at_student_responses_delete" on public.at_student_responses
  for delete to authenticated using (public.can_manage_aulateste());

-- Respostas de responsáveis: gestão lê; responsável cria/edita a própria.
create policy "at_guardian_responses_select" on public.at_guardian_responses
  for select to authenticated
  using (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id());
create policy "at_guardian_responses_insert" on public.at_guardian_responses
  for insert to authenticated
  with check (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id());
create policy "at_guardian_responses_update" on public.at_guardian_responses
  for update to authenticated
  using (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id())
  with check (public.can_manage_aulateste() or respondent_profile_id = public.current_profile_id());
create policy "at_guardian_responses_delete" on public.at_guardian_responses
  for delete to authenticated using (public.can_manage_aulateste());

-- Anexos / assinaturas: gestão tudo; avaliador do relatório lê.
create policy "at_attachments_select" on public.at_attachments
  for select to authenticated
  using (public.can_manage_aulateste() or public.is_aulateste_evaluator(report_id));
create policy "at_attachments_write" on public.at_attachments
  for all to authenticated
  using (public.can_manage_aulateste()) with check (public.can_manage_aulateste());

create policy "at_signatures_select" on public.at_signatures
  for select to authenticated
  using (public.can_manage_aulateste() or public.is_aulateste_evaluator(report_id));
create policy "at_signatures_write" on public.at_signatures
  for all to authenticated
  using (public.can_manage_aulateste()) with check (public.can_manage_aulateste());

-- Logs: gestão lê; autenticados inserem (registro de ação).
create policy "at_logs_select" on public.at_logs
  for select to authenticated using (public.can_manage_aulateste());
create policy "at_logs_insert" on public.at_logs
  for insert to authenticated with check (true);

-- -----------------------------------------------------------------------------
-- 12. Storage: bucket privado para anexos
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('aula-teste', 'aula-teste', false)
  on conflict (id) do nothing;

create policy "at_storage_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'aula-teste'
    and (public.has_permission('aulateste.manage') or public.has_permission('aulateste.evaluate'))
  );
create policy "at_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'aula-teste' and public.has_permission('aulateste.manage'));
create policy "at_storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'aula-teste' and public.has_permission('aulateste.manage'));
create policy "at_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'aula-teste' and public.has_permission('aulateste.manage'));

-- -----------------------------------------------------------------------------
-- 13. Seed do catálogo de critérios (parte do schema — vai p/ produção)
-- -----------------------------------------------------------------------------
insert into public.at_criteria (section, order_index, label) values
  -- Análise curricular
  ('curricular', 1, 'Formação compatível com a vaga'),
  ('curricular', 2, 'Experiência na área'),
  ('curricular', 3, 'Experiência como professor'),
  ('curricular', 4, 'Cursos complementares'),
  ('curricular', 5, 'Domínio de ferramentas tecnológicas'),
  ('curricular', 6, 'Experiência com o público atendido'),
  ('curricular', 7, 'Clareza e organização do currículo'),
  -- Plano de aula
  ('plano_aula', 1, 'Clareza dos objetivos'),
  ('plano_aula', 2, 'Adequação do conteúdo'),
  ('plano_aula', 3, 'Organização das etapas'),
  ('plano_aula', 4, 'Coerência metodológica'),
  ('plano_aula', 5, 'Adequação à faixa etária'),
  ('plano_aula', 6, 'Previsão de participação dos alunos'),
  ('plano_aula', 7, 'Qualidade da avaliação proposta'),
  ('plano_aula', 8, 'Viabilidade de execução'),
  ('plano_aula', 9, 'Adequação dos recursos'),
  ('plano_aula', 10, 'Criatividade e inovação'),
  -- Didática
  ('didatica', 1, 'Clareza na explicação'),
  ('didatica', 2, 'Organização da aula'),
  ('didatica', 3, 'Sequência lógica dos conteúdos'),
  ('didatica', 4, 'Linguagem adequada à turma'),
  ('didatica', 5, 'Capacidade de tornar o conteúdo compreensível'),
  ('didatica', 6, 'Utilização de exemplos'),
  ('didatica', 7, 'Utilização de recursos didáticos'),
  ('didatica', 8, 'Interação com os alunos'),
  ('didatica', 9, 'Estímulo à participação'),
  ('didatica', 10, 'Capacidade de manter a atenção da turma'),
  ('didatica', 11, 'Administração do tempo'),
  ('didatica', 12, 'Flexibilidade durante a aula'),
  ('didatica', 13, 'Condução das atividades'),
  ('didatica', 14, 'Postura profissional'),
  ('didatica', 15, 'Comunicação verbal'),
  ('didatica', 16, 'Comunicação não verbal'),
  ('didatica', 17, 'Segurança ao ensinar'),
  ('didatica', 18, 'Criatividade'),
  ('didatica', 19, 'Capacidade de identificar dificuldades'),
  ('didatica', 20, 'Capacidade de adaptar a explicação'),
  -- Domínio da temática
  ('dominio', 1, 'Conhecimento do tema'),
  ('dominio', 2, 'Precisão das informações'),
  ('dominio', 3, 'Atualização do conteúdo'),
  ('dominio', 4, 'Segurança ao responder perguntas'),
  ('dominio', 5, 'Capacidade de relacionar teoria e prática'),
  ('dominio', 6, 'Utilização de exemplos adequados'),
  ('dominio', 7, 'Aprofundamento compatível com a turma'),
  ('dominio', 8, 'Domínio da terminologia da área'),
  ('dominio', 9, 'Capacidade de corrigir equívocos'),
  ('dominio', 10, 'Capacidade de contextualizar o conteúdo'),
  ('dominio', 11, 'Coerência entre o plano e a aula ministrada'),
  -- Professor atual da turma
  ('professor_atual', 1, 'Adequação da aula ao nível da turma'),
  ('professor_atual', 2, 'Domínio do conteúdo'),
  ('professor_atual', 3, 'Organização'),
  ('professor_atual', 4, 'Didática'),
  ('professor_atual', 5, 'Interação com os estudantes'),
  ('professor_atual', 6, 'Controle e condução da turma'),
  ('professor_atual', 7, 'Postura profissional'),
  ('professor_atual', 8, 'Capacidade de adaptação'),
  ('professor_atual', 9, 'Respeito ao planejamento'),
  ('professor_atual', 10, 'Uso dos recursos disponíveis'),
  ('professor_atual', 11, 'Percepção da resposta dos alunos'),
  ('professor_atual', 12, 'Compatibilidade com a proposta pedagógica da instituição'),
  ('professor_atual', 13, 'Potencial para assumir a turma'),
  -- Comissão avaliadora
  ('comissao', 1, 'Apresentação pessoal'),
  ('comissao', 2, 'Pontualidade'),
  ('comissao', 3, 'Organização'),
  ('comissao', 4, 'Postura ética'),
  ('comissao', 5, 'Comunicação'),
  ('comissao', 6, 'Didática'),
  ('comissao', 7, 'Domínio do conteúdo'),
  ('comissao', 8, 'Cumprimento do plano de aula'),
  ('comissao', 9, 'Utilização do tempo'),
  ('comissao', 10, 'Interação com a turma'),
  ('comissao', 11, 'Capacidade de responder perguntas'),
  ('comissao', 12, 'Alinhamento com a instituição'),
  ('comissao', 13, 'Potencial profissional'),
  ('comissao', 14, 'Disponibilidade'),
  ('comissao', 15, 'Adequação ao perfil da vaga')
on conflict (section, order_index) do nothing;
