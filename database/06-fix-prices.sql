
-- ============================================
-- SCRIPT 6 (FINAL): Correção de Datas e Valores
-- ============================================

-- 1. Arrumar a data do EVENTO (Etapa) para 13/12/2025
UPDATE public.stages
SET date = '2025-12-13'
WHERE name = '5º Torneio Entre Amigos';

-- 2. Arrumar as INSCRIÇÕES (Pagamentos)
-- Valor: R$ 250,00
-- Data do Pagamento: HOJE (NOW()) - pois é quando foi registrado
UPDATE public.payments
SET 
    amount = 250.00,
    created_at = NOW() -- Define como data/hora atual
FROM public.stages s
WHERE public.payments.stage_id = s.id
  AND s.name = '5º Torneio Entre Amigos';

-- Conferência final
SELECT 
    'EVENTO' as tipo,
    name as nome,
    date as data_evento,
    NULL as valor
FROM public.stages 
WHERE name = '5º Torneio Entre Amigos'

UNION ALL

SELECT 
    'PAGAMENTO' as tipo,
    t.team_name,
    p.created_at,
    p.amount
FROM public.payments p
JOIN public.teams t ON p.team_id = t.id
JOIN public.stages s ON p.stage_id = s.id
WHERE s.name = '5º Torneio Entre Amigos'
LIMIT 5;
