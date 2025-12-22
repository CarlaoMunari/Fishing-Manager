
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDebug() {
    console.log('🔍 DEEP DEBUG PAYMENTS...');

    // 1. Get the company ID we expect
    const { data: users } = await supabase.from('users').select('id, slug').limit(5);
    console.log('Users found:', users);

    // 2. Get the payments
    const { data: payments } = await supabase
        .from('payments')
        .select('id, status, payment_method, company_id, team_id');

    console.log(`Total payments in DB: ${payments?.length}`);
    if (payments && payments.length > 0) {
        console.log('Sample payment:', payments[0]);
        const nullCompany = payments.filter(p => !p.company_id);
        console.log(`Payments with NULL company_id: ${nullCompany.length}`);

        const pending = payments.filter(p => p.status === 'pending');
        console.log(`Payments with status 'pending': ${pending.length} (Expected ~20)`);

        const direct = payments.filter(p => p.payment_method === 'direct');
        console.log(`Payments with method 'direct': ${direct.length} (Expected ~20)`);
    } else {
        console.log('❌ NO PAYMENTS FOUND IN DB!');
    }
}

deepDebug().catch(console.error);
