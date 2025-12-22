
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyIntegrity() {
    console.log('--- VERIFYING INTEGRITY ---');

    console.log('1. Fetching Stage...');
    const { data: stages, error: stageError } = await supabase
        .from('stages')
        .select('id, company_id')
        .eq('name', '5º Torneio Entre Amigos');

    if (stageError || !stages || stages.length === 0) {
        console.error('❌ Stage fetch failed:', stageError);
        return;
    }
    const stage = stages[0];
    console.log(`   Stage ID: ${stage.id}`);
    console.log(`   Stage Company ID: ${stage.company_id}`);

    console.log('2. Fetching One Team...');
    const { data: teams, error: teamError } = await supabase
        .from('teams')
        .select('id, team_name')
        .eq('stage_id', stage.id)
        .limit(1);

    if (teamError || !teams || teams.length === 0) {
        console.error('❌ Team fetch failed:', teamError);
        return;
    }
    const team = teams[0];
    console.log(`   Team ID: ${team.id} (${team.team_name})`);

    console.log('3. Fetching Payment for this Team...');
    const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('*')
        .eq('team_id', team.id);

    if (payError) {
        console.error('❌ Payment fetch error:', payError);
    } else if (!payments || payments.length === 0) {
        console.log('❌ Payment NOT found via SELECT (RLS likely blocking)');
    } else {
        const payment = payments[0];
        console.log(`✅ Payment found!`);
        console.log(`   Payment ID: ${payment.id}`);
        console.log(`   Payment Status: ${payment.status}`);
        console.log(`   Payment Company ID: ${payment.company_id}`);
        console.log(`   User Auth ID: 17b7a427-d966-4062-bfc9-0825849a4b43`);
        console.log(`   Match? ${payment.company_id === '17b7a427-d966-4062-bfc9-0825849a4b43' ? 'YES' : 'NO'}`);
    }
    console.log('--- END ---');
}

verifyIntegrity().catch(console.error);
