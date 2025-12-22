
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTeams() {
    // 1. Get all teams
    const { data: teams, error } = await supabase.from('teams').select('id, team_name, stage_id');

    if (error) {
        console.error('Error fetching teams:', error);
        return;
    }

    console.log(`Total TEAMS in database: ${teams.length}`);
    if (teams.length > 0) {
        console.log('Sample teams:', teams.slice(0, 3));
        const nullStage = teams.filter(t => !t.stage_id);
        console.log(`Teams with NULL stage_id: ${nullStage.length}`);
    }
}

checkAllTeams();
