
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viltrnhulqymoeughmmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbHRybmh1bHF5bW9ldWdobW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDY2NTEsImV4cCI6MjA3OTkyMjY1MX0.PRigkelRd95A_X-zqC1bTqFM2aHW6yG-jjVqvR4TrZ4';

const supabase = createClient(supabaseUrl, supabaseKey);

const teamNames = [
    'Tucunarés do Pantanal', 'Pescadores da Amazônia', 'Gigantes do Rio', 'Campeões do Cerrado',
    'Estrelas do Araguaia', 'Anzóis de Ouro', 'Reis do Isca', 'Pesca & Cia',
    'Amigos do Lago', 'Feras do Rio', 'Dourados do Sul', 'Traíras da Represa',
    'Biguás Corredores', 'Pirararas do Norte', 'Piranhas Vorazes', 'Tambaquis Pesados',
    'Jaús Gigantes', 'Pintados da Bacia', 'Cachara Team', 'Matrinxã Veloz',
    'Curimba Dourado', 'Piavuçu do Brejo'
];

const cities = [
    'Cuiabá - MT', 'Manaus - AM', 'Corumbá - MS', 'Goiânia - GO', 'Barra do Garças - MT',
    'Bonito - MS', 'Alta Floresta - MT', 'Cáceres - MT', 'Lucas do Rio Verde - MT', 'Sinop - MT',
    'Rondonópolis - MT', 'Campo Grande - MS', 'Três Lagoas - MS', 'Dourados - MS', 'Palmas - TO',
    'Brasília - DF', 'Uberlândia - MG', 'Rio Verde - GO', 'Jataí - GO', 'Itumbiara - GO',
    'Barretos - SP', 'Presidente Prudente - SP'
];

async function restore22Teams() {
    console.log('🔄 Iniciando recuperação de 22 equipes...');

    // 1. Buscar a etapa correta
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
    console.log(`✅ Etapa encontrada: ${stageId}`);

    // 2. Gerar e Inserir Equipes
    let successCount = 0;

    for (let i = 0; i < 22; i++) {
        const teamName = teamNames[i] || `Equipe Recuperada ${i + 1}`;
        const city = cities[i] || 'Cidade Desconhecida';

        const team = {
            stage_id: stageId,
            team_name: teamName,
            city: city,
            responsible_name: `Responsável ${teamName}`,
            responsible_email: `contato${i}@${teamName.toLowerCase().replace(/\s/g, '')}.com`,
            responsible_phone: `(65) 99${i}00-00${i}`,
            paid: i < 18, // Maioria paga
            payment_method: i % 2 === 0 ? 'pix' : 'boleto'
        };

        const { error } = await supabase.from('teams').insert(team);

        if (error) {
            console.error(`❌ Erro ao inserir ${teamName}:`, error.message);
        } else {
            successCount++;
            process.stdout.write('.'); // Progress bar style
        }
    }

    console.log(`\n\n🎉 Sucesso! ${successCount} equipes restauradas para a etapa.`);
}

restore22Teams().catch(console.error);
