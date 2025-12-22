
import { supabase } from './src/lib/supabase.ts';

async function checkPaymentsSchema() {
    console.log('\n🔍 Verificando schema da tabela payments...\n');

    const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Erro:', error.message);
    } else {
        console.log('✅ Estrutura da tabela payments:');
        if (payments && payments.length > 0) {
            console.log(Object.keys(payments[0]));
            if ('company_id' in payments[0]) {
                console.log('⚠️ COLUNA COMPANY_ID ENCONTRADA!');
                console.log('Valor do primeiro registro:', payments[0].company_id);
            } else {
                console.log('ℹ️ Coluna company_id NÃO encontrada nos dados retornados.');
            }
        } else {
            console.log('Nenhum pagamento encontrado para verificar colunas.');
            // Insert dummy to check fields returned
            const { error: insError } = await supabase.from('payments').insert({ amount: 1 }).select();
            if (insError) console.log('Erro ao tentar inserir dummy:', insError.message);
        }
    }
}

checkPaymentsSchema().catch(console.error);
