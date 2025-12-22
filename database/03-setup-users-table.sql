-- ============================================
-- SCRIPT: Configurar Tabela Users e Admin
-- ============================================
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE TABELA USERS EXISTE E ADICIONAR COLUNAS SE NECESSÁRIO
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Criar tabela users se não existir
        CREATE TABLE public.users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            name TEXT,
            role TEXT NOT NULL DEFAULT 'captain',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        RAISE NOTICE 'Tabela users criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela users já existe. Verificando colunas...';
        
        -- Adicionar coluna updated_at se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'users' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Coluna updated_at adicionada!';
        END IF;
    END IF;

    -- Habilitar RLS se não estiver
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    -- Criar políticas se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Public read users'
    ) THEN
        CREATE POLICY "Public read users" ON public.users
            FOR SELECT USING (true);
        RAISE NOTICE 'Política de leitura criada!';
    END IF;

END $$;

-- 2. CONFIGURAR USUÁRIO ADMIN
-- ============================================
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'carlao.basket@gmail.com';
BEGIN
    -- Buscar user id do auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ ATENÇÃO: Usuário % não encontrado no auth.users!', v_email;
        RAISE NOTICE '📝 Você precisa criar este usuário primeiro:';
        RAISE NOTICE '   1. Vá em: Authentication > Users > Add user';
        RAISE NOTICE '   2. Email: %', v_email;
        RAISE NOTICE '   3. Senha: Admin@2025';
        RAISE NOTICE '   4. Execute este script novamente';
    ELSE
        RAISE NOTICE '✅ Usuário % encontrado com ID: %', v_email, v_user_id;
        
        -- Inserir/atualizar usuário na tabela users
        INSERT INTO public.users (id, email, name, role, updated_at)
        VALUES (
            v_user_id,
            v_email,
            'Carlos Admin',
            'super_admin',
            NOW()
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            role = 'super_admin',
            name = 'Carlos Admin',
            updated_at = NOW();
        
        RAISE NOTICE '✅ Usuário % configurado como super_admin!', v_email;
    END IF;
END $$;

-- 3. VERIFICAR CONFIGURAÇÃO FINAL
-- ============================================
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    au.email as auth_email,
    u.created_at
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.email = 'carlao.basket@gmail.com'
   OR au.email = 'carlao.basket@gmail.com';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Deve mostrar 1 linha com:
-- - id: UUID do usuário
-- - email: carlao.basket@gmail.com
-- - name: Carlos Admin
-- - role: super_admin
-- - auth_email: carlao.basket@gmail.com
