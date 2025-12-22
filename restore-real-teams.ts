
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

const realTeams = [
    { name: "Sodpesca / Olegário's Fishing", paid: true, members: ["Gu Preto", "Ramon", "Gabriel"] },
    { name: "Tucuna Show", paid: false, members: ["Sita", "Lucas"] },
    { name: "W.L.F Fishing", paid: false, members: ["Willian K", "Leo B", "Felipe"] },
    { name: "Hipólito Pesca", paid: true, members: ["Diogo", "Bia"] },
    { name: "Maníacos por Tucuna", paid: false, members: ["Marcello", "Vitor", "Gabriel"] },
    { name: "Fishing pro", paid: true, members: ["Vitor Lambert", "Victor Neftali", "Kayque"] },
    { name: "Tucuna Crazy", paid: true, members: ["Vitinho", "Chapolin", "mini Chapolin"] },
    { name: "Blue Fish", paid: false, members: ["Walnnin", "Hebert", "Moraes"] },
    { name: "Equipe Jr", paid: true, members: ["Igor Ribeiro", "Murilo Ribeiro", "Rafael Ribeiro"] },
    { name: "Ice Fishing", paid: true, members: ["Caio Henrique", "Igor Luppi", "Cezar Rodrigo"] },
    { name: "M. Braido.", paid: true, members: ["Moacyr", "Augusto", "Guilherme"] },
    { name: "Loja pesque Mais", paid: false, members: ["Bruno", "Cesinha", "Pedrão"] },
    { name: "Clínica do Pescador", paid: true, members: ["Rafael", "Gustavo", "Machadinho"] },
    { name: "Turbinados jigs", paid: false, members: ["Zanetti", "Zé Leonardo", "Caca"] },
    { name: "GRC fishing", paid: true, members: ["Gilbert", "Rogério", "Cleber"] },
    { name: "Lure Fishing", paid: true, members: ["Uelton", "Bruno", "João Pedro"] },
    { name: "Equipe só os Bocudão", paid: true, members: ["Petterson Landulfo", "Breno Landulfo", "Pedro Miller"] },
    { name: "Equipe Gato preto", paid: true, members: ["Wygor", "Glauber", "Cezinha"] },
    { name: "Zero 34", paid: false, members: ["Cícero", "Getúlio"] },
    { name: "ARP Jumelo Jigs", paid: false, members: ["Paulo", "Ângelo Gabriel", "Renato Ceron"] }
];

async function restoreRealTeams() {
    console.log('🔄 Iniciando importação das equipes reais...');

    // 1. Buscar a etapa "5º Torneio Entre Amigos"
    const { data: stages, error: stageError } = await supabase
        .from('stages')
        .select('id')
        .eq('name', '5º Torneio Entre Amigos')
        .order('created_at', { ascending: false })
        .limit(1);

    if (stageError || !stages || stages.length === 0) {
        console.error('❌ Etapa "5º Torneio Entre Amigos" não encontrada.');
        return;
    }

    const stageId = stages[0].id;
    console.log(`✅ Etapa alvo: ${stageId}`);

    let successCount = 0;

    for (const t of realTeams) {
        // Formatar membros para JSONB
        const formattedMembers = t.members.map(m => ({
            name: m,
            nickname: m.split(' ')[0], // Improvisando apelido
            rg: ''
        }));

        const teamData = {
            stage_id: stageId,
            team_name: t.name,
            city: 'Não informada', // Dados não fornecidos
            responsible_name: t.members[0], // Assume o primeiro como responsável
            responsible_email: 'pendente@email.com',
            responsible_phone: '(00) 00000-0000',
            members: formattedMembers,
            paid: t.paid,
            payment_method: t.paid ? 'pix' : null
        };

        const { data: insertedTeam, error } = await supabase
            .from('teams')
            .insert(teamData)
            .select()
            .single();

        if (error) {
            console.error(`❌ Erro ao inserir ${t.name}:`, error.message);
        } else {
            console.log(`✅ Inserido: ${t.name}`);
            successCount++;

            // Se pago, inserir registro na tabela payments também (se necessário pela lógica do app)
            // O app parece usar a tabela 'payments' separada baseada no TeamManagement.tsx
            if (t.paid && insertedTeam) {
                const { error: payError } = await supabase
                    .from('payments')
                    .insert({
                        team_id: insertedTeam.id,
                        stage_id: stageId,
                        status: 'paid',
                        amount: 100.00, // Valor fictício
                        payment_method: 'pix',
                        proof_url: 'restored_by_admin'
                    });
                if (payError) console.error(`   ⚠️ Erro ao criar pagamento para ${t.name}:`, payError.message);
            }
        }
    }

    console.log(`\n🎉 Concluído! ${successCount}/${realTeams.length} equipes importadas.`);
}

restoreRealTeams().catch(console.error);
