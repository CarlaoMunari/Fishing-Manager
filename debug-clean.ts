
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDebug() {
    console.log('--- DEBUG START ---');

    const { data: stages } = await supabase
        .from('stages')
        .select('id, name, company_id')
        .eq('name', '5º Torneio Entre Amigos');

    if (!stages || stages.length === 0) {
        console.log('Stage NOT found');
        return;
    }

    const stage = stages[0];
    console.log(`Stage: ${stage.name}`);
    console.log(`Stage Company ID: ${stage.company_id}`);

    const { data: payments } = await supabase
        .from('payments')
        .select('id, status, company_id')
        .eq('stage_id', stage.id);

    console.log(`Payments count: ${payments?.length}`);

    if (payments && payments.length > 0) {
        console.log('First Payment Company ID:', payments[0].company_id);
    }

    console.log('--- DEBUG END ---');
}

deepDebug().catch(console.error);
