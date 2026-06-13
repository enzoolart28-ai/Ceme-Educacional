-- =============================================================================
-- Migration: Módulo de Comunicação Interna
-- Sistema CME Educacional
-- =============================================================================
-- Comunicados (announcements) com público-alvo, confirmação de leitura
-- (announcement_reads), mensagens diretas 1:1 (messages) e notificações de
-- painel (notifications). Estrutura interna; integração com e-mail/WhatsApp fica
-- para o futuro.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enums
-- -----------------------------------------------------------------------------
create type public.announcement_target as enum (
  'all',        -- todos os usuários
  'class',      -- uma turma (target_id = classes.id)
  'course',     -- um curso (target_id = courses.id)
  'guardians',  -- todos os responsáveis
  'teachers',   -- todos os professores
  'user'        -- um usuário específico (target_id = profiles.id)
);

create type public.notification_type as enum (
  'info',
  'success',
  'warning',
  'announcement',
  'message'
);

-- -----------------------------------------------------------------------------
-- 2. Tabelas
-- -----------------------------------------------------------------------------
create table public.announcements (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  message        text not null,
  author_id      uuid references public.profiles (id) on delete set null,
  target_type    public.announcement_target not null default 'all',
  target_id      uuid,  -- turma/curso/usuário conforme target_type
  attachment_url text,
  created_at     timestamptz not null default now()
);
create index announcements_target_idx on public.announcements (target_type, target_id);
create index announcements_author_idx on public.announcements (author_id);

create table public.announcement_reads (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  read_at         timestamptz not null default now(),
  unique (announcement_id, user_id)
);
create index announcement_reads_user_idx on public.announcement_reads (user_id);

create table public.messages (
  id             uuid primary key default gen_random_uuid(),
  sender_id      uuid references public.profiles (id) on delete set null,
  receiver_id    uuid not null references public.profiles (id) on delete cascade,
  subject        text,
  body           text,
  attachment_url text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index messages_receiver_idx on public.messages (receiver_id);
create index messages_sender_idx on public.messages (sender_id);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  message    text,
  type       public.notification_type not null default 'info',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id);

-- -----------------------------------------------------------------------------
-- 3. Helpers
-- -----------------------------------------------------------------------------
-- Quem pode enviar comunicados gerais (admin/direção/coordenação/secretaria).
create or replace function public.can_send_announcements()
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_staff();
$$;

-- O usuário logado é destinatário deste comunicado?
create or replace function public.can_view_announcement(
  p_type public.announcement_target,
  p_target uuid
)
returns boolean language sql stable security definer set search_path = public
as $$
  select case
    when public.is_staff() then true
    when p_type = 'all' then true
    when p_type = 'teachers' then exists (
      select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'professor'
    )
    when p_type = 'guardians' then exists (
      select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'responsavel'
    )
    when p_type = 'user' then p_target = public.current_profile_id()
    when p_type = 'class' then (
      public.is_enrolled(p_target)
      or public.teaches_class(p_target)
      or exists (
        select 1 from public.class_students cs
          join public.students s on s.id = cs.student_id
         where cs.class_id = p_target and public.guards_student(s.id)
      )
    )
    when p_type = 'course' then (
      public.enrolled_in_course(p_target)
      or public.guardian_of_course_student(p_target)
      or exists (
        select 1 from public.classes c
         where c.course_id = p_target and public.teaches_class(c.id)
      )
    )
    else false
  end;
$$;

-- -----------------------------------------------------------------------------
-- 4. RLS
-- -----------------------------------------------------------------------------
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- announcements: vê quem é destinatário (ou autor); envia staff ou professor da turma
create policy "announcements_select" on public.announcements
  for select to authenticated
  using (author_id = public.current_profile_id() or public.can_view_announcement(target_type, target_id));
create policy "announcements_insert" on public.announcements
  for insert to authenticated
  with check (
    author_id = public.current_profile_id()
    and (
      public.can_send_announcements()
      or (target_type = 'class' and public.teaches_class(target_id))
    )
  );
create policy "announcements_update" on public.announcements
  for update to authenticated
  using (author_id = public.current_profile_id() or public.is_staff())
  with check (author_id = public.current_profile_id() or public.is_staff());
create policy "announcements_delete" on public.announcements
  for delete to authenticated
  using (author_id = public.current_profile_id() or public.is_staff());

-- announcement_reads: o próprio marca como lido; autor/staff veem os recibos
create policy "announcement_reads_select" on public.announcement_reads
  for select to authenticated
  using (
    user_id = public.current_profile_id()
    or public.is_staff()
    or exists (
      select 1 from public.announcements a
       where a.id = announcement_id and a.author_id = public.current_profile_id()
    )
  );
create policy "announcement_reads_insert" on public.announcement_reads
  for insert to authenticated
  with check (user_id = public.current_profile_id());

-- messages: privadas entre remetente e destinatário
create policy "messages_select" on public.messages
  for select to authenticated
  using (sender_id = public.current_profile_id() or receiver_id = public.current_profile_id());
create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (sender_id = public.current_profile_id());
create policy "messages_update" on public.messages
  for update to authenticated
  using (receiver_id = public.current_profile_id())
  with check (receiver_id = public.current_profile_id());
create policy "messages_delete" on public.messages
  for delete to authenticated
  using (sender_id = public.current_profile_id() or receiver_id = public.current_profile_id());

-- notifications: cada um vê/gerencia as próprias; staff pode criar para outros
create policy "notifications_select" on public.notifications
  for select to authenticated
  using (user_id = public.current_profile_id());
create policy "notifications_insert" on public.notifications
  for insert to authenticated
  with check (public.is_staff() or user_id = public.current_profile_id());
create policy "notifications_update" on public.notifications
  for update to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());
create policy "notifications_delete" on public.notifications
  for delete to authenticated
  using (user_id = public.current_profile_id());

-- -----------------------------------------------------------------------------
-- 5. Função: enviar mensagem (cria a mensagem + notifica o destinatário)
-- -----------------------------------------------------------------------------
create or replace function public.send_message(
  p_receiver uuid,
  p_subject  text,
  p_body     text,
  p_attachment text default null
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_sender uuid;
  v_id     uuid;
begin
  v_sender := public.current_profile_id();
  if v_sender is null then
    raise exception 'SEM_PERFIL';
  end if;
  if p_receiver is null or p_receiver = v_sender then
    raise exception 'DESTINATARIO_INVALIDO';
  end if;

  insert into public.messages (sender_id, receiver_id, subject, body, attachment_url)
  values (v_sender, p_receiver, nullif(p_subject, ''), nullif(p_body, ''), nullif(p_attachment, ''))
  returning id into v_id;

  insert into public.notifications (user_id, title, message, type)
  values (p_receiver, 'Nova mensagem', coalesce(nullif(p_subject, ''), 'Você recebeu uma mensagem.'), 'message');

  return v_id;
end;
$$;

revoke all on function public.send_message(uuid, text, text, text) from public;
grant execute on function public.send_message(uuid, text, text, text) to authenticated;

-- Destinatários que o usuário pode escolher ao enviar mensagem.
-- Staff fala com todos; demais (aluno/responsável/professor) falam com a
-- equipe e professores (RLS de profiles esconde os outros perfis dos não-staff).
create or replace function public.list_message_recipients()
returns table (id uuid, full_name text, role public.user_role)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, p.role
    from public.profiles p
   where p.user_id <> auth.uid()
     and p.status = 'active'
     and (
       public.is_staff()
       or p.role in ('admin', 'diretor', 'coordenacao', 'secretaria', 'professor')
     )
   order by p.full_name;
$$;
grant execute on function public.list_message_recipients() to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Supabase Storage (anexos de comunicados/mensagens)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('communication-files', 'communication-files', true)
  on conflict (id) do nothing;

create policy "comm_files_read" on storage.objects
  for select to authenticated using (bucket_id = 'communication-files');
create policy "comm_files_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'communication-files');
create policy "comm_files_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'communication-files' and (owner = auth.uid() or public.is_staff()));
create policy "comm_files_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'communication-files' and (owner = auth.uid() or public.is_staff()));
