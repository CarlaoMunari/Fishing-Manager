-- ============================================
-- SCRIPT 2: Políticas RLS (Row Level Security)
-- ============================================
-- Execute APÓS o script 01-create-image-tables.sql
-- Projeto: Deep Nadir - Sistema de Fichas e Galeria

-- ============================================
-- POLÍTICAS: event_logos
-- ============================================

-- Habilitar RLS
ALTER TABLE public.event_logos ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (para exibir logo nas fichas)
DROP POLICY IF EXISTS "Public Read Event Logos" ON public.event_logos;
CREATE POLICY "Public Read Event Logos" 
ON public.event_logos 
FOR SELECT 
USING (true);

-- Apenas usuários autenticados podem inserir/atualizar/deletar
DROP POLICY IF EXISTS "Auth Write Event Logos" ON public.event_logos;
CREATE POLICY "Auth Write Event Logos" 
ON public.event_logos 
FOR ALL 
USING (auth.role() = 'authenticated');

-- ============================================
-- POLÍTICAS: sponsor_logos
-- ============================================

ALTER TABLE public.sponsor_logos ENABLE ROW LEVEL SECURITY;

-- Leitura pública apenas dos logos ativos
DROP POLICY IF EXISTS "Public Read Active Sponsors" ON public.sponsor_logos;
CREATE POLICY "Public Read Active Sponsors" 
ON public.sponsor_logos 
FOR SELECT 
USING (active = true);

-- Admin pode ver todos (para gerenciar)
DROP POLICY IF EXISTS "Auth Read All Sponsors" ON public.sponsor_logos;
CREATE POLICY "Auth Read All Sponsors" 
ON public.sponsor_logos 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Apenas autenticados podem modificar
DROP POLICY IF EXISTS "Auth Write Sponsors" ON public.sponsor_logos;
CREATE POLICY "Auth Write Sponsors" 
ON public.sponsor_logos 
FOR ALL 
USING (auth.role() = 'authenticated');

-- ============================================
-- POLÍTICAS: stage_images
-- ============================================

ALTER TABLE public.stage_images ENABLE ROW LEVEL SECURITY;

-- Leitura pública
DROP POLICY IF EXISTS "Public Read Stage Images" ON public.stage_images;
CREATE POLICY "Public Read Stage Images" 
ON public.stage_images 
FOR SELECT 
USING (true);

-- Apenas autenticados podem modificar
DROP POLICY IF EXISTS "Auth Write Stage Images" ON public.stage_images;
CREATE POLICY "Auth Write Stage Images" 
ON public.stage_images 
FOR ALL 
USING (auth.role() = 'authenticated');

-- ============================================
-- POLÍTICAS: champion_gallery
-- ============================================

ALTER TABLE public.champion_gallery ENABLE ROW LEVEL SECURITY;

-- Leitura pública
DROP POLICY IF EXISTS "Public Read Champions" ON public.champion_gallery;
CREATE POLICY "Public Read Champions" 
ON public.champion_gallery 
FOR SELECT 
USING (true);

-- Apenas autenticados podem modificar
DROP POLICY IF EXISTS "Auth Write Champions" ON public.champion_gallery;
CREATE POLICY "Auth Write Champions" 
ON public.champion_gallery 
FOR ALL 
USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFICAÇÃO: Listar políticas criadas
-- ============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('event_logos', 'sponsor_logos', 'stage_images', 'champion_gallery')
ORDER BY tablename, policyname;
