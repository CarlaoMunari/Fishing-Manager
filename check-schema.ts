import { supabase } from './src/lib/supabase.ts';

async function checkTeamsSchema() {
    console.log('\n🔍 Verificando schema da tabela teams...\n');

    // Tentar pegar uma equipe existente para ver os campos
    const { data, error } = await supabase
        .from('teams')
        .select('*')
        .limit(1);

    if (error) {
        console.log('❌ Erro:', error.message);
        console.log('\n📋 Vou tentar inserir uma equipe teste para descobrir os campos...\n');

        // Tentar inserir com campos minimos
        const testTeam = {
            stage_id: 'c6b72fe7-d170-4c5e-9b67-ab8ba24e59db',
            members: [{ name: 'Teste', nickname: 'T', rg: '123' }]
        };

        const { error: insertError } = await supabase
            .from('teams')
            .insert(testTeam);

        if (insertError) {
            console.log('Erro ao inserir:', insertError);
        }
    } else {
        console.log('✅ Estrutura da tabela teams:');
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log('Nenhuma equipe encontrada ainda');
        }
    }
}

checkTeamsSchema().catch(console.error);
