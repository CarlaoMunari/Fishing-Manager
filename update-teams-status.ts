
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTeamsToPendingDirect() {
    console.log('🔄 Atualizando equipes para "Direto" e "Pendente"...');

    // 1. Buscar a etapa
    const { data: stages } = await supabase
        .from('stages')
        .select('id')
        .eq('name', '5º Torneio Entre Amigos')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!stages || stages.length === 0) {
        console.error('❌ Etapa não encontrada.');
        return;
    }
    const stageId = stages[0].id;

    // 2. Buscar todas as equipes dessa etapa
    const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('stage_id', stageId);

    if (!teams || teams.length === 0) {
        console.error('❌ Nenhuma equipe encontrada nesta etapa.');
        return;
    }

    console.log(`📋 Encontradas ${teams.length} equipes. Atualizando pagamentos...`);

    let updatedCount = 0;

    for (const team of teams) {
        // Upsert payment record to ensure it exists and has correct status/method
        // We use upsert because some might already have 'paid' records, others might have none.
        // We want ALL to be 'pending' and 'direct'.
        const { error } = await supabase
            .from('payments')
            .upsert({
                team_id: team.id,
                stage_id: stageId,
                status: 'pending',          // "aparecer para aprovação"
                payment_method: 'direct',   // "Método de pagamento Direto"
                amount: 100.00,
                proof_url: null             // Reset proof if any
            }, { onConflict: 'team_id' });  // Assuming team_id is unique per payment/stage or primary key of payments is compatible

        if (error) {
            console.error(`❌ Erro ao atualizar ${team.team_name}:`, error.message);
        } else {
            updatedCount++;
        }
    }

    console.log(`\n✅ Sucesso! ${updatedCount} equipes atualizadas para "Pendente" / "Direto".`);
}

updateTeamsToPendingDirect().catch(console.error);
