import { supabase } from './supabase';

/**
 * Gera uma chave de acesso GPS única e aleatória
 * Formato: ABC123-XYZ789 (12 caracteres)
 */
export function generateGPSAccessKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part1 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${part1}-${part2}`;
}

/**
 * Cria uma chave de acesso GPS para uma equipe em uma etapa
 */
export async function createGPSAccessKey(teamId: string, stageId: string) {
    try {
        // Verificar se já existe chave ativa
        const { data: existing } = await supabase
            .from('gps_access_keys')
            .select('*')
            .eq('team_id', teamId)
            .eq('stage_id', stageId)
            .eq('is_active', true)
            .single();

        if (existing) {
            return { data: existing, error: null };
        }

        // Gerar nova chave
        const accessKey = generateGPSAccessKey();

        // Buscar data da etapa para definir expiração
        const { data: stage } = await supabase
            .from('stages')
            .select('date')
            .eq('id', stageId)
            .single();

        const expiresAt = stage?.date
            ? new Date(new Date(stage.date).getTime() + 24 * 60 * 60 * 1000) // +1 dia após etapa
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 dias default

        // Inserir chave
        const { data, error } = await supabase
            .from('gps_access_keys')
            .insert({
                team_id: teamId,
                stage_id: stageId,
                access_key: accessKey,
                expires_at: expiresAt.toISOString(),
                is_active: true
            })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        console.error('Erro ao criar chave GPS:', error);
        return { data: null, error };
    }
}

/**
 * Valida uma chave de acesso GPS
 */
export async function validateGPSAccessKey(accessKey: string) {
    try {
        console.log('🔍 Validating GPS key:', accessKey);

        const { data, error } = await supabase
            .from('gps_access_keys')
            .select(`
                *,
                teams (id, team_name),
                stages (id, name, date, gps_start_time, gps_end_time, gps_tracking_enabled)
            `)
            .eq('access_key', accessKey)
            .eq('is_active', true)
            .single();

        console.log('📊 Query result:', { data, error });

        if (error || !data) {
            console.log('❌ Key not found or error:', error);
            return { valid: false, data: null, message: 'Chave inválida ou expirada' };
        }

        // Verificar expiração
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            console.log('⏰ Key expired:', data.expires_at);
            return { valid: false, data: null, message: 'Chave expirada' };
        }

        // Atualizar last_used_at
        await supabase
            .from('gps_access_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', data.id);

        console.log('✅ Key validated successfully');
        return { valid: true, data, message: 'Chave válida' };
    } catch (error) {
        console.error('💥 Erro ao validar chave GPS:', error);
        return { valid: false, data: null, message: 'Erro na validação' };
    }
}

/**
 * Salva uma localização GPS
 */
export async function saveGPSLocation(params: {
    teamId: string;
    stageId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    timestamp: string;
}) {
    try {
        const { data, error } = await supabase
            .from('gps_locations')
            .insert({
                team_id: params.teamId,
                stage_id: params.stageId,
                latitude: params.latitude,
                longitude: params.longitude,
                accuracy: params.accuracy || null,
                speed: params.speed || null,
                heading: params.heading || null,
                altitude: params.altitude || null,
                timestamp: params.timestamp
            })
            .select()
            .single();

        return { data, error };
    } catch (error) {
        console.error('Erro ao salvar localização GPS:', error);
        return { data: null, error };
    }
}

/**
 * Busca as últimas localizações de uma etapa
 */
export async function getLatestGPSLocations(stageId: string, limit: number = 100) {
    try {
        const { data, error } = await supabase
            .from('gps_locations')
            .select(`
                *,
                teams (id, team_name)
            `)
            .eq('stage_id', stageId)
            .order('created_at', { ascending: false })
            .limit(limit);

        return { data, error };
    } catch (error) {
        console.error('Erro ao buscar localizações GPS:', error);
        return { data: null, error };
    }
}

/**
 * Busca o histórico de trajeto de uma equipe
 */
export async function getTeamGPSHistory(teamId: string, stageId: string) {
    try {
        const { data, error } = await supabase
            .from('gps_locations')
            .select('*')
            .eq('team_id', teamId)
            .eq('stage_id', stageId)
            .order('timestamp', { ascending: true });

        return { data, error };
    } catch (error) {
        console.error('Erro ao buscar histórico GPS:', error);
        return { data: null, error };
    }
}

/**
 * Verifica se o rastreamento está dentro do horário permitido
 */
export function isWithinTrackingTime(
    startTime: string | null,
    endTime: string | null
): boolean {
    if (!startTime || !endTime) return true; // Se não configurado, permite sempre

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutos desde meia-noite

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    return currentTime >= start && currentTime <= end;
}
