-- Migration: Adicionar campo de isenção de inscrição na tabela teams
-- Descrição: Permite ao administrador marcar equipes como isentas de pagamento

-- Adicionar coluna exempt_registration
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS exempt_registration BOOLEAN DEFAULT FALSE;

-- Adicionar comentário
COMMENT ON COLUMN teams.exempt_registration IS 'Indica se a equipe está isenta de pagamento (R$ 0,00)';

-- Criar índice para consultas mais rápidas
CREATE INDEX IF NOT EXISTS idx_teams_exempt_registration ON teams(exempt_registration);
