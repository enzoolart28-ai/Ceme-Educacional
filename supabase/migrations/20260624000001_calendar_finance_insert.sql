-- =============================================================================
-- Migration: Calendário — financeiro pode criar eventos com qualquer visibilidade
-- =============================================================================
-- Antes, o perfil financeiro só conseguia criar eventos 'private' ou do tipo
-- 'vencimento_financeiro'. Ao escolher visibilidade "Restrito (envolvidos)" num
-- evento comum, o INSERT era bloqueado pela RLS. Aqui liberamos quem tem
-- finance.manage a criar eventos de qualquer tipo/visibilidade (created_by = si).
-- =============================================================================

drop policy if exists "calendar_events_insert" on public.calendar_events;
create policy "calendar_events_insert" on public.calendar_events
  for insert to authenticated
  with check (
    created_by = public.current_profile_id()
    and (
      visibility = 'private'                                -- evento pessoal: qualquer um (só pra si)
      or public.is_staff()
      or public.has_permission('finance.manage')            -- financeiro: cria eventos (qualquer visibilidade)
      or (class_id is not null and public.teaches_class(class_id))
    )
  );
