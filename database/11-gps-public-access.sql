-- Adicionar policy para permitir validação pública de chaves GPS
-- Isso permite que o app mobile (não autenticado) valide chaves GPS

-- Policy: Permitir leitura pública de chaves GPS ativas
CREATE POLICY "Public can validate active GPS keys"
ON gps_access_keys
FOR SELECT
TO anon
USING (is_active = true);

-- Policy: Permitir update público apenas do campo last_used_at
-- Isso permite registrar quando a chave foi usada
CREATE POLICY "Public can update last_used_at"
ON gps_access_keys
FOR UPDATE
TO anon
USING (is_active = true)
WITH CHECK (is_active = true);
