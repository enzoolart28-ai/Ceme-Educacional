-- =============================================================================
-- Migration: Captação de leads aberta a qualquer usuário logado
-- =============================================================================
-- Qualquer perfil (professor, financeiro, etc.) pode CADASTRAR um lead pela tela
-- "Captar Lead". A leitura/edição/exclusão da lista continua restrita ao pessoal
-- comercial (policies existentes que exigem leads.manage / admin permanecem).
-- Política aditiva: policies permissivas somam com OR, então isto apenas ABRE o
-- insert, sem afetar as demais.
-- =============================================================================

create policy "leads_insert_any_authenticated" on public.leads
  for insert to authenticated
  with check (true);
