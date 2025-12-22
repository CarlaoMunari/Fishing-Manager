
-- ============================================
-- SCRIPT 5 (CORRIGIDO): Forçar Atualização Geral
-- ============================================
-- Este script corrige TUDO de uma vez:
-- 1. Vincula todos os pagamentos à sua empresa (para aparecerem no painel)
-- 2. Atualiza o valor para R$ 250,00 (conforme você avisou)
-- 3. Define como Pendente e Direto

UPDATE public.payments
SET 
    company_id = s.company_id,   -- Corrige a "invisibilidade"
    amount = 250.00,             -- Corrige o valor para 250
    status = 'pending',          -- Garante que está pendente
    payment_method = 'direct'    -- Garante que é pagamento direto
FROM public.stages s
WHERE public.payments.stage_id = s.id
  AND s.name = '5º Torneio Entre Amigos'; -- Aplica na etapa correta

-- Verificar o resultado final
SELECT 
    COUNT(*) as total_pagamentos,
    SUM(amount) as valor_total,
    status
FROM public.payments p
JOIN public.stages s ON p.stage_id = s.id
WHERE s.name = '5º Torneio Entre Amigos'
GROUP BY status;
