-- ============================================
-- DIAGNÓSTICO COMPLETO DO LOGIN
-- ============================================
-- Execute este script e me envie TODO o resultado

-- 1. VERIFICAR SE TABELA USERS EXISTE
-- ============================================
SELECT 
    'TABELA USERS' as verificacao,
    CASE 
        WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')
        THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE - Execute 03-setup-users-table.sql'
    END as status;

-- 2. VERIFICAR COLUNAS DA TABELA USERS
-- ============================================
SELECT 
    'COLUNAS DA TABELA USERS' as verificacao,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE USUÁRIO EXISTE NO AUTH.USERS
-- ============================================
SELECT 
    'USUÁRIO NO AUTH.USERS' as verificacao,
    id,
    email,
    created_at,
    confirmed_at,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN '✅ Confirmado'
        ELSE '⚠️ Não confirmado'
    END as status_confirmacao
FROM auth.users
WHERE email = 'carlao.basket@gmail.com';

-- SE VAZIO: Usuário NÃO existe! Crie em Authentication > Users

-- 4. VERIFICAR SE USUÁRIO EXISTE NA TABELA PUBLIC.USERS
-- ============================================
SELECT 
    'USUÁRIO NA TABELA PUBLIC.USERS' as verificacao,
    u.id,
    u.email,
    u.name,
    u.role,
    u.created_at,
    CASE 
        WHEN u.role = 'super_admin' THEN '✅ Role correto'
        ELSE '⚠️ Role incorreto: ' || u.role
    END as status_role
FROM public.users u
WHERE u.email = 'carlao.basket@gmail.com';

-- SE VAZIO: Execute 03-setup-users-table.sql

-- 5. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
    'POLÍTICAS RLS' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================
SELECT 
    'RLS HABILITADO' as verificacao,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- ============================================
-- INSTRUÇÕES BASEADAS NO RESULTADO:
-- ============================================

-- SE "TABELA USERS" = NÃO EXISTE:
--   Execute: 03-setup-users-table.sql

-- SE "USUÁRIO NO AUTH.USERS" = VAZIO:
--   1. Vá em Supabase > Authentication > Users
--   2. Clique em "Add user"
--   3. Email: carlao.basket@gmail.com
--   4. Senha: Admin@2025
--   5. Clique em "Create user"
--   6. Execute este script novamente
--   7. Execute: 03-setup-users-table.sql

-- SE "USUÁRIO NA TABELA PUBLIC.USERS" = VAZIO:
--   Execute: 03-setup-users-table.sql

-- SE "USUÁRIO NA TABELA PUBLIC.USERS" role != 'super_admin':
--   Execute: 03-setup-users-table.sql

-- ============================================
-- TESTE FINAL
-- ============================================
SELECT 
    'TESTE FINAL - LOGIN DEVE FUNCIONAR?' as verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM auth.users au
            INNER JOIN public.users pu ON au.id = pu.id
            WHERE au.email = 'carlao.basket@gmail.com'
              AND pu.role = 'super_admin'
              AND au.confirmed_at IS NOT NULL
        )
        THEN '✅ SIM - Todos os requisitos OK!'
        ELSE '❌ NÃO - Verifique os resultados acima'
    END as resultado;
