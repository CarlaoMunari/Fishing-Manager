import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Team } from '@/types';

interface FishEntry {
    measurement: string;
    color: 'blue' | 'yellow' | null;
}

interface TeamScore {
    team: Team;
    fish: FishEntry[];
    average: number;
    total: number;
    biggestBlue: number | null;
    biggestYellow: number | null;
}

export function StageRankingPrint() {
    const [searchParams] = useSearchParams();
    const stageId = searchParams.get('stage_id');
    const circuitId = searchParams.get('circuit_id');
    const isCircuitRanking = !!circuitId && !stageId;

    const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [fishCount, setFishCount] = useState(6); // Default
    const [title, setTitle] = useState('Classificação');

    console.log('🔍 StageRankingPrint - stageId:', stageId, 'circuitId:', circuitId, 'isCircuitRanking:', isCircuitRanking);

    useEffect(() => {
        if (stageId) {
            console.log('📥 Carregando dados para stage:', stageId);
            loadStageData();
        } else if (circuitId) {
            console.log('📥 Carregando dados para circuito:', circuitId);
            loadCircuitData();
        } else {
            console.error('❌ Nenhum stage_id ou circuit_id fornecido na URL');
        }
    }, [stageId, circuitId]);

    const loadStageData = async () => {
        try {
            console.log('🔄 Iniciando loadStageData...');

            // 1. Buscar Stage e Circuit para pegar fishCount
            const { data: stageData, error: stageError } = await supabase
                .from('stages')
                .select('*, circuit:circuits(*)')
                .eq('id', stageId)
                .single();

            if (stageError) throw stageError;

            setTitle(`Classificação - ${stageData.name}`);
            const currentFishCount = stageData?.circuit?.fish_count || stageData?.circuit?.fishCount || 6;
            setFishCount(currentFishCount);

            // 2. Buscar Teams
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .eq('stage_id', stageId);

            console.log('👥 Teams data:', teamsData);
            console.log('❌ Teams error:', teamsError);

            // 3. Buscar Results
            const { data: resultsData, error: resultsError } = await supabase
                .from('results')
                .select('*')
                .eq('stage_id', stageId);

            console.log('📊 Results data:', resultsData);
            console.log('❌ Results error:', resultsError);

            const scores: TeamScore[] = (teamsData || []).map((item: any) => {
                const team: Team = {
                    id: item.id,
                    stageId: item.stage_id,
                    teamName: item.team_name,
                    city: item.city,
                    responsibleName: item.responsible_name,
                    responsibleEmail: item.responsible_email || '',
                    responsiblePhone: item.responsible_phone,
                    responsiblePhone2: item.responsible_phone2,
                    members: item.members,
                    paid: item.paid,
                    paymentMethod: item.payment_method,
                    registeredAt: new Date(item.created_at),
                };

                const result = resultsData?.find((r: any) => r.team_id === item.id);

                if (result) {
                    const fish: FishEntry[] = [];
                    for (let i = 0; i < currentFishCount; i++) {
                        fish.push({
                            measurement: result.fish_measurements[i]?.toString() || '',
                            color: result.fish_colors?.[i] || null,
                        });
                    }

                    return {
                        team,
                        fish,
                        average: result.average_score || 0,
                        total: result.fish_measurements.reduce((sum: number, m: number) => sum + (m || 0), 0),
                        biggestBlue: result.biggest_blue || null,
                        biggestYellow: result.biggest_yellow || null,
                    };
                }

                return {
                    team,
                    fish: Array(currentFishCount).fill(null).map(() => ({ measurement: '', color: null })),
                    average: 0,
                    total: 0,
                    biggestBlue: null,
                    biggestYellow: null,
                };
            });

            console.log('✅ Scores processados:', scores);
            setTeamScores(scores);
            setLoading(false);
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            setLoading(false);
        }
    };

    const loadCircuitData = async () => {
        try {
            console.log('🔄 Iniciando loadCircuitData...');

            // 1. Buscar Circuit
            const { data: circuitData, error: circuitError } = await supabase
                .from('circuits')
                .select('*')
                .eq('id', circuitId)
                .single();

            if (circuitError) throw circuitError;

            setTitle(`Classificação Geral - ${circuitData.name}`);
            const currentFishCount = circuitData?.fish_count || circuitData?.fishCount || 6;
            setFishCount(currentFishCount);

            // 2. Buscar todas as Stages do circuito
            const { data: stagesData, error: stagesError } = await supabase
                .from('stages')
                .select('id')
                .eq('circuit_id', circuitId);

            if (stagesError) throw stagesError;
            const stageIds = stagesData?.map((s: any) => s.id) || [];

            // 3. Buscar todos os Teams de todas as etapas
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('*')
                .in('stage_id', stageIds);

            console.log('👥 Teams data (all stages):', teamsData);
            if (teamsError) console.error('Error fetching teams:', teamsError);

            // 4. Buscar todos os Results de todas as etapas
            const { data: resultsData, error: resultsError } = await supabase
                .from('results')
                .select('*')
                .in('stage_id', stageIds);

            console.log('📊 Results data (all stages):', resultsData);
            if (resultsError) console.error('Error fetching results:', resultsError);

            // 5. Agrupar por nome da equipe + cidade (para identificar equipes únicas)
            const teamMap = new Map<string, { team: any; results: any[] }>();

            (teamsData || []).forEach((item: any) => {
                const key = `${item.team_name}_${item.city}`;
                if (!teamMap.has(key)) {
                    teamMap.set(key, { team: item, results: [] });
                }
                const result = resultsData?.find((r: any) => r.team_id === item.id);
                if (result) {
                    teamMap.get(key)!.results.push(result);
                }
            });

            // 6. Calcular pontuação agregada para cada equipe
            const scores: TeamScore[] = Array.from(teamMap.values()).map(({ team: item, results }) => {
                const team: Team = {
                    id: item.id,
                    stageId: item.stage_id,
                    teamName: item.team_name,
                    city: item.city,
                    responsibleName: item.responsible_name,
                    responsibleEmail: item.responsible_email || '',
                    responsiblePhone: item.responsible_phone,
                    responsiblePhone2: item.responsible_phone2,
                    members: item.members,
                    paid: item.paid,
                    paymentMethod: item.payment_method,
                    registeredAt: new Date(item.created_at),
                };

                // Soma de todos os resultados nas diferentes etapas
                let totalAverage = 0;
                let totalSum = 0;
                let maxBlue: number | null = null;
                let maxYellow: number | null = null;

                results.forEach((result: any) => {
                    totalAverage += result.average_score || 0;
                    totalSum += result.fish_measurements?.reduce((sum: number, m: number) => sum + (m || 0), 0) || 0;
                    if (result.biggest_blue && (!maxBlue || result.biggest_blue > maxBlue)) {
                        maxBlue = result.biggest_blue;
                    }
                    if (result.biggest_yellow && (!maxYellow || result.biggest_yellow > maxYellow)) {
                        maxYellow = result.biggest_yellow;
                    }
                });

                return {
                    team,
                    fish: [], // Não mostramos detalhes de peixes na classificação geral
                    average: totalAverage,
                    total: totalSum,
                    biggestBlue: maxBlue,
                    biggestYellow: maxYellow,
                };
            });

            console.log('✅ Circuit scores processados:', scores);
            setTeamScores(scores);
            setLoading(false);
        } catch (error) {
            console.error('❌ Erro ao carregar dados do circuito:', error);
            setLoading(false);
        }
    };

    const getAllFishByColor = (score: TeamScore, color: 'blue' | 'yellow'): number[] => {
        return score.fish
            .map((f) => ({
                measurement: parseFloat(f.measurement) || 0,
                color: f.color,
            }))
            .filter(f => f.measurement > 0 && f.color === color)
            .map(f => f.measurement)
            .sort((a, b) => b - a);
    };

    const blueScores = teamScores
        .filter(score => score.biggestBlue && score.biggestBlue > 0)
        .map(score => ({
            team: score.team.teamName || 'Sem nome',
            biggest: score.biggestBlue!,
            allFish: getAllFishByColor(score, 'blue'),
        }))
        .sort((a, b) => {
            if (b.biggest !== a.biggest) return b.biggest - a.biggest;

            for (let i = 1; i < Math.max(a.allFish.length, b.allFish.length); i++) {
                const aFish = a.allFish[i] || 0;
                const bFish = b.allFish[i] || 0;
                if (bFish !== aFish) return bFish - aFish;
            }
            return 0;
        });

    const yellowScores = teamScores
        .filter(score => score.biggestYellow && score.biggestYellow > 0)
        .map(score => ({
            team: score.team.teamName || 'Sem nome',
            biggest: score.biggestYellow!,
            allFish: getAllFishByColor(score, 'yellow'),
        }))
        .sort((a, b) => {
            if (b.biggest !== a.biggest) return b.biggest - a.biggest;

            for (let i = 1; i < Math.max(a.allFish.length, b.allFish.length); i++) {
                const aFish = a.allFish[i] || 0;
                const bFish = b.allFish[i] || 0;
                if (bFish !== aFish) return bFish - aFish;
            }
            return 0;
        });

    const ranking = [...teamScores]
        .filter(s => s.average > 0)
        .sort((a, b) => {
            if (b.average !== a.average) return b.average - a.average;
            return b.total - a.total;
        });

    const totalFish = teamScores.reduce((sum, score) => {
        return sum + score.fish.filter(f => parseFloat(f.measurement) > 0).length;
    }, 0);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    return (
        <div className="print-container">
            <style>{`
                @media print {
                    body { margin: 0; padding: 20px; }
                    .print-container { max-width: none; }
                    .no-print { display: none; }
                    @page { size: A4 landscape; margin: 15mm; }
                }
                .print-container {
                    max-width: 297mm;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                    font-family: Arial, sans-serif;
                }
                .header-date {
                    text-align: right;
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 20px;
                }
                .highlights {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .highlight-box {
                    border: 2px solid #333;
                    padding: 15px;
                }
                .highlight-title {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 5px;
                }
                .highlight-value {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    padding: 5px 0;
                }
                .total-fish {
                    text-align: right;
                    font-weight: bold;
                    margin: 10px 0;
                    font-size: 14px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                th {
                    background: #333;
                    color: white;
                    padding: 8px;
                    text-align: left;
                    font-size: 11px;
                    border: 1px solid #333;
                }
                td {
                    padding: 6px 8px;
                    border: 1px solid #ddd;
                    font-size: 11px;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .ranking-col { width: 60px; text-align: center; font-weight: bold; }
                .team-col { min-width: 150px; }
                .fish-col { width: 70px; text-align: center; }
                .avg-col, .total-col { width: 70px; text-align: center; font-weight: bold; }
                .team-info { font-weight: bold; }
                .team-city { font-size: 10px; color: #666; }
            `}</style>

            <div className="no-print" style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '10px 20px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    🖨️ Imprimir
                </button>
            </div>

            <div className="header-date">
                {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
            </div>

            <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
                {title}
            </h1>

            <div className="highlights">
                <div className="highlight-box">
                    <div className="highlight-title">MAIOR PEIXE AZUL</div>
                    {blueScores.length > 0 ? (
                        <div className="highlight-value">
                            <span>{blueScores[0].team}</span>
                            <span>{blueScores[0].biggest.toFixed(1)}</span>
                        </div>
                    ) : (
                        <div className="highlight-value">Nenhum registro</div>
                    )}
                </div>

                <div className="highlight-box">
                    <div className="highlight-title">MAIOR PEIXE AMARELO</div>
                    {yellowScores.length > 0 ? (
                        <div className="highlight-value">
                            <span>{yellowScores[0].team}</span>
                            <span>{yellowScores[0].biggest.toFixed(1)}</span>
                        </div>
                    ) : (
                        <div className="highlight-value">Nenhum registro</div>
                    )}
                </div>
            </div>

            <div className="total-fish">
                TOTAL DE PEIXES: {totalFish}
            </div>

            <table>
                <thead>
                    <tr>
                        <th className="ranking-col">RANKING</th>
                        <th className="team-col">EQUIPE</th>
                        {Array.from({ length: fishCount }).map((_, i) => (
                            <th key={i} className="fish-col">PEIXE {i + 1}</th>
                        ))}
                        <th className="avg-col">MÉDIA</th>
                        <th className="total-col">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {ranking.map((score, index) => (
                        <tr key={score.team.id}>
                            <td className="ranking-col">
                                {index + 1}º<br />
                                <span style={{ fontSize: '9px', color: '#666' }}>
                                    EQUIPE {index + 1}
                                </span>
                            </td>
                            <td className="team-col">
                                <div className="team-info">{score.team.teamName}</div>
                                <div className="team-city">{score.team.city}</div>
                            </td>
                            {score.fish.map((fish, idx) => (
                                <td key={idx} className="fish-col">
                                    {fish.measurement || '-'}
                                </td>
                            ))}
                            <td className="avg-col">{score.average.toFixed(2)}</td>
                            <td className="total-col">{score.total.toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
