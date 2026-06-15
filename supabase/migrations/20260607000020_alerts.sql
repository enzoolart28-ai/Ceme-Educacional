-- =============================================================================
-- Migration: Módulo de Alertas Automáticos
-- Sistema CME Educacional
-- =============================================================================
-- Alertas internos para situações acadêmicas, financeiras, pedagógicas e
-- comerciais. Os alertas são gerados automaticamente a partir dos dados
-- existentes (função generate_alerts) e cada perfil visualiza apenas os
-- alertas relevantes (RLS via can_view_alert).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.alert_type as enum (
  'frequencia_baixa',       -- Aluno com frequência abaixo de 75%
  'faltas_consecutivas',    -- Aluno com 3 faltas seguidas
  'mensalidade_vencida',    -- Aluno com mensalidade vencida
  'ava_inativo',            -- Aluno sem acessar AVA há 7 dias
  'chamada_pendente',       -- Professor sem lançar chamada
  'atividade_sem_correcao', -- Atividade vencida sem correção
  'documento_pendente',     -- Documento pendente
  'certificado_pendente',   -- Certificado pendente
  'lead_sem_retorno',       -- Lead sem retorno
  'evento_proximo',         -- Evento próximo
  'prova_proxima'           -- Prova próxima
);

create type public.alert_priority as enum ('baixa', 'media', 'alta', 'critica');

create type public.alert_status as enum ('novo', 'visualizado', 'resolvido', 'ignorado');

-- -----------------------------------------------------------------------------
-- 2. Permissão (quem pode gerar / tratar alertas)
-- -----------------------------------------------------------------------------
insert into public.permissions (key, label, description) values
  ('alerts.manage', 'Gerenciar alertas', 'Gerar e tratar alertas automáticos.')
on conflict (key) do nothing;

insert into public.role_permissions (role_key, permission_key) values
  ('diretor', 'alerts.manage'),
  ('coordenacao', 'alerts.manage'),
  ('secretaria', 'alerts.manage'),
  ('financeiro', 'alerts.manage')
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. Tabela alerts
-- -----------------------------------------------------------------------------
create table public.alerts (
  id                 uuid primary key default gen_random_uuid(),
  type               public.alert_type not null,
  title              text not null,
  description        text,
  related_user_id    uuid references public.profiles (id) on delete set null,
  related_student_id uuid references public.students (id) on delete cascade,
  related_class_id   uuid references public.classes (id) on delete cascade,
  priority           public.alert_priority not null default 'media',
  status             public.alert_status not null default 'novo',
  resolved_by        uuid references public.profiles (id) on delete set null,
  resolved_at        timestamptz,
  -- Chave de deduplicação: impede recriar um alerta ainda em aberto para a
  -- mesma situação (ver índice parcial abaixo).
  dedupe_key         text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index alerts_type_idx on public.alerts (type);
create index alerts_status_idx on public.alerts (status);
create index alerts_priority_idx on public.alerts (priority);
create index alerts_student_idx on public.alerts (related_student_id);
create index alerts_class_idx on public.alerts (related_class_id);
create index alerts_user_idx on public.alerts (related_user_id);

-- Um único alerta ATIVO (novo/visualizado) por situação; resolvidos/ignorados
-- não bloqueiam — se a situação voltar, um novo alerta pode ser criado.
create unique index alerts_dedupe_active_idx
  on public.alerts (dedupe_key)
  where (status in ('novo', 'visualizado'));

create trigger alerts_set_updated_at
  before update on public.alerts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Visibilidade por perfil
-- -----------------------------------------------------------------------------
-- Regras:
--   admin / diretor      -> todos os alertas
--   coordenação          -> pedagógicos/acadêmicos (+ eventos/provas/certificados)
--   financeiro           -> financeiros (mensalidade)
--   secretaria           -> documentos/certificados (+ eventos/leads)
--   qualquer usuário      -> alertas em que ele é o "usuário relacionado"
--                           (ex.: professor vê a própria chamada pendente)
create or replace function public.can_view_alert(
  p_type public.alert_type,
  p_related_user uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (p_related_user is not null and p_related_user = public.current_profile_id())
    or case public.current_user_role()
      when 'admin' then true
      when 'diretor' then true
      when 'coordenacao' then p_type in (
        'frequencia_baixa', 'faltas_consecutivas', 'ava_inativo',
        'chamada_pendente', 'atividade_sem_correcao', 'prova_proxima',
        'evento_proximo', 'certificado_pendente'
      )
      when 'financeiro' then p_type in ('mensalidade_vencida')
      when 'secretaria' then p_type in (
        'documento_pendente', 'certificado_pendente', 'evento_proximo', 'lead_sem_retorno'
      )
      else false
    end;
$$;

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------
alter table public.alerts enable row level security;

create policy "alerts_select" on public.alerts
  for select to authenticated
  using (public.can_view_alert(type, related_user_id));

create policy "alerts_insert" on public.alerts
  for insert to authenticated
  with check (public.has_permission('alerts.manage'));

create policy "alerts_update" on public.alerts
  for update to authenticated
  using (public.has_permission('alerts.manage') and public.can_view_alert(type, related_user_id))
  with check (public.has_permission('alerts.manage'));

create policy "alerts_delete" on public.alerts
  for delete to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Geração automática de alertas
-- -----------------------------------------------------------------------------
-- Varre os dados e cria alertas para situações pendentes, sem duplicar os que
-- já estão em aberto. Retorna quantos alertas novos foram criados.
create or replace function public.generate_alerts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created integer := 0;
  v_n integer;
begin
  if not public.has_permission('alerts.manage') then
    raise exception 'Sem permissão para gerar alertas.' using errcode = '42501';
  end if;

  -- 1. Frequência abaixo de 75%
  insert into public.alerts (type, title, description, related_student_id, related_class_id, priority, dedupe_key)
  select 'frequencia_baixa',
         'Frequência abaixo de 75%',
         s.full_name || ' está com ' || round(100.0 * f.present / f.total) ||
           '% de frequência na turma ' || c.name || '.',
         f.student_id, f.class_id, 'alta',
         'frequencia_baixa:' || f.student_id || ':' || f.class_id
  from (
    select ar.student_id, a.class_id,
           count(*) as total,
           count(*) filter (where ar.status in ('present', 'late')) as present
    from public.attendance_records ar
    join public.attendance a on a.id = ar.attendance_id
    where a.status = 'finalized'
    group by ar.student_id, a.class_id
  ) f
  join public.students s on s.id = f.student_id
  join public.classes c on c.id = f.class_id
  where f.total >= 1 and (f.present::numeric / f.total) < 0.75
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 2. Três (ou mais) faltas consecutivas
  insert into public.alerts (type, title, description, related_student_id, related_class_id, priority, dedupe_key)
  select 'faltas_consecutivas',
         '3 faltas seguidas',
         s.full_name || ' tem ' || g.streak || ' faltas consecutivas na turma ' || c.name || '.',
         g.student_id, g.class_id, 'alta',
         'faltas_consecutivas:' || g.student_id || ':' || g.class_id
  from (
    select student_id, class_id, max(cnt) as streak
    from (
      select seq.student_id, seq.class_id, seq.grp, count(*) as cnt
      from (
        select ar.student_id, a.class_id, a.date, ar.status,
               row_number() over (partition by ar.student_id, a.class_id order by a.date)
                 - row_number() over (partition by ar.student_id, a.class_id, (ar.status = 'absent') order by a.date) as grp
        from public.attendance_records ar
        join public.attendance a on a.id = ar.attendance_id
        where a.status = 'finalized'
      ) seq
      where seq.status = 'absent'
      group by seq.student_id, seq.class_id, seq.grp
    ) grp_counts
    group by student_id, class_id
  ) g
  join public.students s on s.id = g.student_id
  join public.classes c on c.id = g.class_id
  where g.streak >= 3
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 3. Mensalidade vencida
  insert into public.alerts (type, title, description, related_student_id, related_class_id, priority, dedupe_key)
  select 'mensalidade_vencida',
         'Mensalidade vencida',
         s.full_name || ' tem mensalidade vencida em ' || to_char(i.due_date, 'DD/MM/YYYY') ||
           ' (R$ ' || i.final_value::text || ').',
         i.student_id, i.class_id, 'critica',
         'mensalidade_vencida:' || i.id
  from public.invoices i
  join public.students s on s.id = i.student_id
  where i.status = 'overdue' or (i.status = 'open' and i.due_date < current_date)
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 4. Sem acessar o AVA há 7 dias
  insert into public.alerts (type, title, description, related_student_id, priority, dedupe_key)
  select 'ava_inativo',
         'Sem acessar o AVA há 7 dias',
         s.full_name || ' não acessa o AVA desde ' || to_char(p.last_access, 'DD/MM/YYYY') || '.',
         p.student_id, 'media',
         'ava_inativo:' || p.student_id
  from (
    select student_id, max(updated_at) as last_access
    from public.student_lesson_progress
    group by student_id
  ) p
  join public.students s on s.id = p.student_id
  where p.last_access < now() - interval '7 days'
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 5. Professor sem lançar chamada (turma ativa sem chamada nos últimos 7 dias)
  insert into public.alerts (type, title, description, related_user_id, related_class_id, priority, dedupe_key)
  select 'chamada_pendente',
         'Chamada pendente',
         'A turma ' || c.name || ' está sem chamada lançada nos últimos 7 dias.',
         t.profile_id, c.id, 'media',
         'chamada_pendente:' || c.id
  from public.classes c
  join public.teachers t on t.id = c.main_teacher_id
  where c.status in ('open', 'in_progress')
    and not exists (
      select 1 from public.attendance a
      where a.class_id = c.id and a.date >= current_date - 7
    )
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 6. Atividade vencida sem correção
  insert into public.alerts (type, title, description, related_class_id, priority, dedupe_key)
  select 'atividade_sem_correcao',
         'Atividade vencida sem correção',
         'A atividade "' || oa.title || '" encerrou e tem envios aguardando correção.',
         oa.class_id, 'media',
         'atividade_sem_correcao:' || oa.id
  from public.online_assessments oa
  where oa.end_date is not null and oa.end_date < now()
    and exists (
      select 1 from public.student_assessment_submissions sub
      where sub.assessment_id = oa.id and sub.status = 'submitted'
    )
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 7. Documento pendente
  insert into public.alerts (type, title, description, related_student_id, priority, dedupe_key)
  select 'documento_pendente',
         'Documento pendente',
         coalesce(s.full_name || ': ', '') || 'documento "' || d.title || '" pendente de análise.',
         d.student_id, 'media',
         'documento_pendente:' || d.id
  from public.documents d
  left join public.students s on s.id = d.student_id
  where d.status = 'pendente'
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 8. Certificado pendente (aluno concluiu o curso)
  insert into public.alerts (type, title, description, related_student_id, priority, dedupe_key)
  select 'certificado_pendente',
         'Certificado pendente',
         s.full_name || ' concluiu o curso e está com certificado pendente de emissão.',
         s.id, 'baixa',
         'certificado_pendente:' || s.id
  from public.students s
  where s.status = 'completed'
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 9. Lead sem retorno (sem interação há mais de 7 dias)
  insert into public.alerts (type, title, description, priority, dedupe_key)
  select 'lead_sem_retorno',
         'Lead sem retorno',
         l.full_name || ' está sem retorno desde ' ||
           to_char(coalesce(li.last_at, l.created_at), 'DD/MM/YYYY') || '.',
         'media',
         'lead_sem_retorno:' || l.id
  from public.leads l
  left join (
    select lead_id, max(created_at) as last_at
    from public.lead_interactions
    group by lead_id
  ) li on li.lead_id = l.id
  where l.status in ('novo', 'em_atendimento', 'aguardando_retorno', 'agendado')
    and coalesce(li.last_at, l.created_at) < now() - interval '7 days'
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 10. Evento próximo (próximos 7 dias)
  insert into public.alerts (type, title, description, priority, dedupe_key)
  select 'evento_proximo',
         'Evento próximo',
         'O evento "' || e.name || '" acontece em ' || to_char(e.date, 'DD/MM/YYYY') || '.',
         'baixa',
         'evento_proximo:' || e.id
  from public.events e
  where e.date is not null
    and e.date between current_date and current_date + 7
    and e.status in ('planejado', 'aberto_inscricao')
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  -- 11. Prova próxima (online_assessments publicadas começando nos próximos 7 dias)
  insert into public.alerts (type, title, description, related_class_id, priority, dedupe_key)
  select 'prova_proxima',
         'Prova próxima',
         'A prova "' || oa.title || '" começa em ' || to_char(oa.start_date, 'DD/MM/YYYY') || '.',
         oa.class_id, 'media',
         'prova_proxima:' || oa.id
  from public.online_assessments oa
  where oa.status = 'published'
    and oa.start_date is not null
    and oa.start_date::date between current_date and current_date + 7
  on conflict (dedupe_key) where (status in ('novo', 'visualizado')) do nothing;
  get diagnostics v_n = row_count; v_created := v_created + v_n;

  return v_created;
end;
$$;

grant execute on function public.generate_alerts() to authenticated;
