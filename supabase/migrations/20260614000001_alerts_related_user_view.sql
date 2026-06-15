-- =============================================================================
-- Migration: Alertas - visualizacao pelo usuario relacionado
-- =============================================================================
-- Permite que o usuario diretamente relacionado ao alerta marque o proprio
-- alerta como visualizado. Resolver, ignorar e reabrir continuam restritos a
-- perfis com alerts.manage.
-- =============================================================================

create policy "alerts_related_user_mark_viewed" on public.alerts
  for update to authenticated
  using (
    status = 'novo'
    and related_user_id = public.current_profile_id()
  )
  with check (
    status = 'visualizado'
    and related_user_id = public.current_profile_id()
    and resolved_by is null
    and resolved_at is null
  );

