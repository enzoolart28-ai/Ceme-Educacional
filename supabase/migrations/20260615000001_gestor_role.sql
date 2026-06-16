-- =============================================================================
-- Migration: Perfil Gestor - enum
-- =============================================================================
-- Precisa ficar em migration separada porque novos valores de enum so podem ser
-- usados com seguranca apos commit da transacao que executa ALTER TYPE.
-- =============================================================================

alter type public.user_role add value if not exists 'gestor';

