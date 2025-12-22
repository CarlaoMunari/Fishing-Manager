// Supabase Edge Function para criar usuários empresa
// Arquivo: supabase/functions/create-company-user/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, password, name, slug } = await req.json()

        // Validar dados
        if (!email || !password || !name) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Email, password e name são obrigatórios'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Variáveis de ambiente não configuradas corretamente'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // 1. Verificar se usuário já existe e deletar se necessário
        try {
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.users?.find(u => u.email === email)

            if (existingUser) {
                console.log(`Deletando usuário existente: ${email}`)
                await supabaseAdmin.auth.admin.deleteUser(existingUser.id)

                // Também deletar da tabela users
                await supabaseAdmin.from('users').delete().eq('email', email)
            }
        } catch (cleanupError) {
            console.error('Erro ao limpar usuário existente:', cleanupError)
            // Continuar mesmo se falhar a limpeza
        }

        // 2. Criar novo usuário
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: 'company'
            }
        })

        if (authError) {
            console.error('Auth error:', authError)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Erro ao criar usuário no Auth: ${authError.message}`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Inserir na tabela users
        const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                name,
                role: 'company',
                slug,
                created_at: new Date().toISOString()
            })

        if (userError) {
            console.error('Database error:', userError)
            // Rollback: deletar do Auth
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Erro ao salvar no banco: ${userError.message}`
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                userId: authData.user.id,
                email,
                message: 'Usuário criado com sucesso'
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Erro desconhecido'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
