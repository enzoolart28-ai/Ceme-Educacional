-- =============================================================================
-- Migration: Perfil Comercial
-- Sistema CME Educacional
-- =============================================================================
-- Mantido em migration separada porque novos valores de enum precisam existir
-- antes de serem usados em tabelas/policies na migration seguinte.
-- =============================================================================

alter type public.user_role add value if not exists 'comercial';
