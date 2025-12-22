-- ============================================
-- SCRIPT 1: Criar Tabelas para Sistema de Imagens
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Projeto: Deep Nadir - Sistema de Fichas e Galeria

-- 1. TABELA: event_logos (Logo da Empresa para Fichas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_logos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice único para garantir apenas um logo ativo
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_event_logo 
ON public.event_logos (is_active) 
WHERE is_active = true;

-- Comentários
COMMENT ON TABLE public.event_logos IS 'Logos da empresa do evento para usar nas fichas PDF';
COMMENT ON COLUMN public.event_logos.is_active IS 'Apenas um logo pode estar ativo por vez';

-- ============================================
-- 2. TABELA: sponsor_logos (Logos de Patrocinadores)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sponsor_logos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_sponsor_logos_display_order 
ON public.sponsor_logos (display_order) 
WHERE active = true;

COMMENT ON TABLE public.sponsor_logos IS 'Logos de patrocinadores para exibir no site';
COMMENT ON COLUMN public.sponsor_logos.display_order IS 'Ordem de exibição (menor primeiro)';

-- ============================================
-- 3. TABELA: stage_images (Imagens 800x800 das Etapas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stage_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar por etapa
CREATE INDEX IF NOT EXISTS idx_stage_images_stage_id 
ON public.stage_images (stage_id);

COMMENT ON TABLE public.stage_images IS 'Imagens 800x800 das etapas para exibir no home';

-- ============================================
-- 4. TABELA: champion_gallery (Galeria de Campeões)
-- ============================================
CREATE TABLE IF NOT EXISTS public.champion_gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID REFERENCES public.stages(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca e ordenação
CREATE INDEX IF NOT EXISTS idx_champion_gallery_stage_id 
ON public.champion_gallery (stage_id);

CREATE INDEX IF NOT EXISTS idx_champion_gallery_display_order 
ON public.champion_gallery (display_order);

COMMENT ON TABLE public.champion_gallery IS 'Galeria de fotos dos campeões das etapas';

-- ============================================
-- VERIFICAÇÃO: Listar todas as tabelas criadas
-- ============================================
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('event_logos', 'sponsor_logos', 'stage_images', 'champion_gallery')
ORDER BY table_name;
