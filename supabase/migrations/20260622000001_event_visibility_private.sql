-- =============================================================================
-- Migration: Calendário — visibilidade "private" (evento pessoal)
-- =============================================================================
-- Novo valor de enum. Precisa ficar em migration própria, pois um valor de enum
-- não pode ser ADICIONADO e USADO na mesma transação. As políticas que usam
-- 'private' ficam na migration seguinte (20260622000002).
-- =============================================================================

alter type public.event_visibility add value if not exists 'private';
