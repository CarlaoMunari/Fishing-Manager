
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeams() {
    console.log('Searching for all teams...');
    const { data: allTeams, error } = await supabase.from('teams').select('*');

    if (error) {
        console.error('Error fetching teams:', error);
        return;
    }

    console.log(`Total teams found: ${allTeams.length}`);

    const orphans = allTeams.filter(t => !t.stage_id);
    console.log(`Orphaned teams (no stage_id): ${orphans.length}`);

    if (orphans.length > 0) {
        console.log('Orphaned teams:', orphans.map(t => ({ id: t.id, name: t.team_name })));
    } else {
        console.log('No orphaned teams found. They might have been deleted strictly (Cascade).');
    }

    // Check if there are any stages
    const { data: stages } = await supabase.from('stages').select('*');
    console.log(`Total stages found: ${stages?.length || 0}`);
}

checkTeams();
