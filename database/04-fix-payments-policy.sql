
-- ============================================
-- SCRIPT 4: Corrigir Políticas da Tabela Payments
-- ============================================
-- Execute este script no SQL Editor do Supabase para corrigir 
-- o problema de os pagamentos não aparecerem no painel.

-- 1. Habilitar RLS (garantir que está ativo)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Política de Leitura (SELECT)
-- Permitir que a empresa veja SEUS PRÓPRIOS pagamentos
DROP POLICY IF EXISTS "Companies can view own payments" ON public.payments;
CREATE POLICY "Companies can view own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = company_id);

-- 3. Política de Escrita (INSERT/UPDATE/DELETE)
-- Permitir que a empresa gerencie SEUS PRÓPRIOS pagamentos
DROP POLICY IF EXISTS "Companies can manage own payments" ON public.payments;
CREATE POLICY "Companies can manage own payments" 
ON public.payments 
FOR ALL 
USING (auth.uid() = company_id);

-- 4. Política Pública (Opcional, se o checkout precisar ler status)
-- Permitir leitura pública se necessário (cuidado com dados sensíveis)
-- Por segurança, começamos restrito. O checkout normalmente faz INSERT e não SELECT.

-- Verifica se políticas foram criadas
SELECT * FROM pg_policies WHERE tablename = 'payments';
