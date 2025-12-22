
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPaymentsCompanyId() {
    console.log('🔄 Corrigindo company_id nos pagamentos...');

    // 1. Buscar a etapa e seu company_id
    const { data: stages } = await supabase
        .from('stages')
        .select('id, company_id')
        .eq('name', '5º Torneio Entre Amigos')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!stages || stages.length === 0) {
        console.error('❌ Etapa não encontrada.');
        return;
    }
    const stage = stages[0];
    const stageId = stage.id;
    const companyId = stage.company_id;

    if (!companyId) {
        console.error('❌ Etapa não tem company_id associado!');
        return;
    }

    console.log(`✅ Etapa: ${stageId}, Company: ${companyId}`);

    // 2. Buscar equipes da etapa
    const { data: teams } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('stage_id', stageId);

    if (!teams || teams.length === 0) {
        console.log('Nenhuma equipe encontrada.');
        return;
    }

    let updatedCount = 0;

    for (const team of teams) {
        // Update ONLY payments for this team
        const { error } = await supabase
            .from('payments')
            .update({
                company_id: companyId, // CRUCIAL FIX
                status: 'pending',     // Re-enforce pending
                payment_method: 'direct' // Re-enforce direct
            })
            .eq('team_id', team.id);

        if (error) {
            console.error(`❌ Erro ao atualizar ${team.team_name}:`, error.message);
        } else {
            updatedCount++;
        }
    }

    console.log(`\n✅ Sucesso! ${updatedCount} pagamentos atualizados com company_id.`);
}

fixPaymentsCompanyId().catch(console.error);
