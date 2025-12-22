-- Migration: Sistema de Rastreamento GPS - Tabelas
-- Descrição: Cria estrutura para rastreamento GPS de equipes durante eventos

-- ============================================
-- Tabela de Chaves de Acesso GPS
-- ============================================
CREATE TABLE IF NOT EXISTS gps_access_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    access_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraint para evitar múltiplas chaves ativas por team/stage
    UNIQUE(team_id, stage_id)
);

-- Índices para performance
CREATE INDEX idx_gps_access_keys_team ON gps_access_keys(team_id);
CREATE INDEX idx_gps_access_keys_stage ON gps_access_keys(stage_id);
CREATE INDEX idx_gps_access_keys_key ON gps_access_keys(access_key);
CREATE INDEX idx_gps_access_keys_active ON gps_access_keys(is_active);

-- Comentários
COMMENT ON TABLE gps_access_keys IS 'Chaves de acesso para rastreamento GPS das equipes';
COMMENT ON COLUMN gps_access_keys.access_key IS 'Chave única de 12 caracteres (ex: ABC123-XYZ789)';
COMMENT ON COLUMN gps_access_keys.is_active IS 'Se a chave está ativa (pode ser desabilitada manualmente)';

-- ============================================
-- Tabela de Localizações GPS
-- ============================================
CREATE TABLE IF NOT EXISTS gps_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(6, 2), -- em metros
    speed DECIMAL(6, 2), -- em km/h (opcional)
    heading DECIMAL(5, 2), -- direção em graus (0-360)
    altitude DECIMAL(8, 2), -- em metros (opcional)
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance e consultas comuns
CREATE INDEX idx_gps_locations_team ON gps_locations(team_id);
CREATE INDEX idx_gps_locations_stage ON gps_locations(stage_id);
CREATE INDEX idx_gps_locations_timestamp ON gps_locations(timestamp DESC);
CREATE INDEX idx_gps_locations_created ON gps_locations(created_at DESC);
CREATE INDEX idx_gps_locations_team_stage ON gps_locations(team_id, stage_id);

-- Índice espacial para consultas geográficas (opcional, mas útil)
CREATE INDEX idx_gps_locations_coords ON gps_locations(latitude, longitude);

-- Comentários
COMMENT ON TABLE gps_locations IS 'Histórico de localizações GPS das equipes durante eventos';
COMMENT ON COLUMN gps_locations.latitude IS 'Latitude em graus decimais';
COMMENT ON COLUMN gps_locations.longitude IS 'Longitude em graus decimais';
COMMENT ON COLUMN gps_locations.accuracy IS 'Precisão do GPS em metros';
COMMENT ON COLUMN gps_locations.timestamp IS 'Timestamp do GPS (hora em que foi capturado no dispositivo)';

-- ============================================
-- Atualizar Tabela Stages com Configurações GPS
-- ============================================
ALTER TABLE stages 
ADD COLUMN IF NOT EXISTS gps_tracking_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gps_start_time TIME,
ADD COLUMN IF NOT EXISTS gps_end_time TIME,
ADD COLUMN IF NOT EXISTS gps_update_interval INTEGER DEFAULT 30; -- segundos

-- Comentários
COMMENT ON COLUMN stages.gps_tracking_enabled IS 'Se o rastreamento GPS está habilitado para esta etapa';
COMMENT ON COLUMN stages.gps_start_time IS 'Horário de início do rastreamento (ex: 07:30)';
COMMENT ON COLUMN stages.gps_end_time IS 'Horário de término do rastreamento (ex: 21:00)';
COMMENT ON COLUMN stages.gps_update_interval IS 'Intervalo de atualização em segundos (padrão: 30s)';
