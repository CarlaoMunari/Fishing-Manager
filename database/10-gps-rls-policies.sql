-- Migration: RLS Policies para Sistema GPS
-- Descrição: Políticas de segurança para tabelas de rastreamento GPS

-- ============================================
-- RLS para gps_access_keys
-- ============================================

-- Habilitar RLS
ALTER TABLE gps_access_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver todas as chaves
CREATE POLICY "Admins can view all GPS access keys"
ON gps_access_keys
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'company')
    )
);

-- Policy: Admins podem inserir chaves
CREATE POLICY "Admins can insert GPS access keys"
ON gps_access_keys
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'company')
    )
);

-- Policy: Admins podem atualizar chaves
CREATE POLICY "Admins can update GPS access keys"
ON gps_access_keys
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'company')
    )
);

-- Policy: Admins podem deletar chaves
CREATE POLICY "Admins can delete GPS access keys"
ON gps_access_keys
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'company')
    )
);

-- ============================================
-- RLS para gps_locations
-- ============================================

-- Habilitar RLS
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver todas as localizações
CREATE POLICY "Admins can view all GPS locations"
ON gps_locations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'company')
    )
);

-- Policy: Qualquer usuário autenticado pode inserir localizações
-- (O app mobile usará uma chave de API, mas isso permite flexibilidade)
CREATE POLICY "Authenticated users can insert GPS locations"
ON gps_locations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Ninguém pode atualizar localizações (apenas inserir)
-- Isso mantém a integridade do histórico

-- Policy: Admins podem deletar localizações (para limpeza)
CREATE POLICY "Admins can delete GPS locations"
ON gps_locations
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'company')
    )
);
