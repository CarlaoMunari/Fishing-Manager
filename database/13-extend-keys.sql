-- Atualiza a data de expiração das chaves de GPS ativas
-- Define a expiração para 2 dias após a data da etapa
-- Isso corrige chaves "expiradas" quando a data da etapa é alterada

UPDATE public.gps_access_keys
SET expires_at = (s.date + interval '2 days')
FROM public.stages s
WHERE public.gps_access_keys.stage_id = s.id
  AND public.gps_access_keys.is_active = true;

-- Verifica o resultado (Opcional)
SELECT 
    k.access_key, 
    k.expires_at, 
    s.date as stage_date,
    (s.date + interval '2 days') as new_expiration
FROM public.gps_access_keys k
JOIN public.stages s ON k.stage_id = s.id
WHERE k.is_active = true
LIMIT 10;
