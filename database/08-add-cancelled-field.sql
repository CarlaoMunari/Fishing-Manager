-- Migration: Adicionar campos de cancelamento na tabela teams
-- Descrição: Permite marcar equipes como canceladas com motivo e data

-- Adicionar coluna cancelled
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE;

-- Adicionar coluna cancelled_at
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna cancellation_reason
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Adicionar comentários
COMMENT ON COLUMN teams.cancelled IS 'Indica se a inscrição foi cancelada';
COMMENT ON COLUMN teams.cancelled_at IS 'Data e hora do cancelamento';
COMMENT ON COLUMN teams.cancellation_reason IS 'Motivo do cancelamento da inscrição';

-- Criar índice para consultas mais rápidas
CREATE INDEX IF NOT EXISTS idx_teams_cancelled ON teams(cancelled);
