
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreTeams() {
    console.log('Restoring teams...');

    // 1. Get the new stage ID
    const { data: stages, error: stageError } = await supabase
        .from('stages')
        .select('id')
        .eq('name', '5º Torneio Entre Amigos')
        .order('created_at', { ascending: false }) // Get the most recent one
        .limit(1);

    if (stageError || !stages || stages.length === 0) {
        console.error('New stage not found!', stageError);
        return;
    }

    const newStageId = stages[0].id;
    console.log(`Found new stage ID: ${newStageId}`);

    // 2. Get orphaned teams
    const { data: orphans, error: orphanError } = await supabase
        .from('teams')
        .select('id')
        .is('stage_id', null);

    if (orphanError) {
        console.error('Error finding orphans:', orphanError);
        return;
    }

    console.log(`Found ${orphans.length} orphaned teams.`);

    if (orphans.length === 0) {
        console.log('No orphans to restore.');
        return;
    }

    // 3. Update orphans
    const orphanIds = orphans.map(t => t.id);
    const { error: updateError } = await supabase
        .from('teams')
        .update({ stage_id: newStageId })
        .in('id', orphanIds);

    if (updateError) {
        console.error('Error updating teams:', updateError);
    } else {
        console.log(`Successfully updated ${orphans.length} teams to stage ${newStageId}`);
    }
}

restoreTeams();
