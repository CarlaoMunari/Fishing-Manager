import { supabase } from './src/lib/supabase.ts';

async function insertTestTeams() {
    // Buscar a primeira etapa disponível
    const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('id')
        .limit(1)
        .single();

    if (stagesError || !stages) {
        console.error('Erro ao buscar etapa:', stagesError);
        return;
    }

    const stageId = stages.id;

    // 5 equipes fictícias com campos corretos
    const teams = [
        {
            stage_id: stageId,
            team_name: 'Tucunarés do Pantanal',
            city: 'Cuiabá - MT',
            responsible_name: 'João Silva Santos',
            responsible_email: 'joao.silva@email.com',
            responsible_phone: '(65) 99876-5432',
            responsible_phone2: '(65) 98765-4321',
            members: [
                { name: 'João Silva Santos', nickname: 'João', rg: '12.345.678-9' },
                { name: 'Pedro Oliveira Costa', nickname: 'Pedrão', rg: '23.456.789-0' },
                { name: 'Carlos Eduardo Souza', nickname: 'Cadu', rg: '34.567.890-1' },
                { name: 'Rafael Mendes Lima', nickname: 'Rafa', rg: '45.678.901-2' }
            ],
            paid: true,
            payment_method: 'pix'
        },
        {
            stage_id: stageId,
            team_name: 'Pescadores da Amazônia',
            city: 'Manaus - AM',
            responsible_name: 'Antonio Carlos Ferreira',
            responsible_email: 'antonio.ferreira@email.com',
            responsible_phone: '(92) 99123-4567',
            responsible_phone2: '(92) 98234-5678',
            members: [
                { name: 'Antonio Carlos Ferreira', nickname: 'Toninho', rg: '56.789.012-3' },
                { name: 'Marcos Vinicius Alves', nickname: 'Marquinhos', rg: '67.890.123-4' },
                { name: 'Felipe Santos Rodrigues', nickname: 'Lipe', rg: '78.901.234-5' },
                { name: 'Lucas Gabriel Martins', nickname: 'Gabi', rg: '89.012.345-6' }
            ],
            paid: true,
            payment_method: 'pix'
        },
        {
            stage_id: stageId,
            team_name: 'Gigantes do Rio',
            city: 'Corumbá - MS',
            responsible_name: 'Ricardo Almeida Nunes',
            responsible_email: 'ricardo.nunes@email.com',
            responsible_phone: '(67) 99345-6789',
            responsible_phone2: null,
            members: [
                { name: 'Ricardo Almeida Nunes', nickname: 'Rick', rg: '90.123.456-7' },
                { name: 'Fernando Augusto Silva', nickname: 'Nando', rg: '01.234.567-8' },
                { name: 'Rodrigo Henrique Costa', nickname: 'Digão', rg: '12.345.678-0' },
                { name: 'Daniel Moreira Santos', nickname: 'Dani', rg: '23.456.789-1' }
            ],
            paid: true,
            payment_method: 'boleto'
        },
        {
            stage_id: stageId,
            team_name: 'Campeões do Cerrado',
            city: 'Goiânia - GO',
            responsible_name: 'José Roberto Batista',
            responsible_email: 'jose.batista@email.com',
            responsible_phone: '(62) 99567-8901',
            responsible_phone2: '(62) 98678-9012',
            members: [
                { name: 'José Roberto Batista', nickname: 'Zé Roberto', rg: '34.567.890-2' },
                { name: 'Gabriel Fernandes Lima', nickname: 'Biel', rg: '45.678.901-3' },
                { name: 'Thiago Pereira Souza', nickname: 'Thia', rg: '56.789.012-4' },
                { name: 'Bruno Henrique Dias', nickname: 'Bruninho', rg: '67.890.123-5' }
            ],
            paid: true,
            payment_method: 'pix'
        },
        {
            stage_id: stageId,
            team_name: 'Estrelas do Araguaia',
            city: 'Barra do Garças - MT',
            responsible_name: 'Paulo Henrique Campos',
            responsible_email: 'paulo.campos@email.com',
            responsible_phone: '(66) 99789-0123',
            responsible_phone2: '(66) 98890-1234',
            members: [
                { name: 'Paulo Henrique Campos', nickname: 'Paulão', rg: '78.901.234-6' },
                { name: 'André Luiz Barbosa', nickname: 'Deco', rg: '89.012.345-7' },
                { name: 'Gustavo Castro Rocha', nickname: 'Guga', rg: '90.123.456-8' },
                { name: 'Mateus Silva Oliveira', nickname: 'Matt', rg: '01.234.567-9' }
            ],
            paid: true,
            payment_method: 'pix'
        }
    ];

    console.log(`\n🎣 Inserindo ${teams.length} equipes de teste...\n`);

    let successCount = 0;

    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        const { data, error } = await supabase
            .from('teams')
            .insert(team)
            .select();

        if (error) {
            console.error(`❌ Erro ao inserir "${team.team_name}":`, error.message);
        } else {
            console.log(`✅ ${i + 1}. ${team.team_name} - ${team.city}`);
            successCount++;
        }
    }

    console.log(`\n📊 Total: ${successCount}/${teams.length} equipes inseridas!`);
    console.log('🎣 Pronto para testar!\n');
}

insertTestTeams().catch(console.error);
