import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Circuit, Stage } from '@/types';

interface TeamRanking {
    teamName: string;
    city: string;
    score: number;
    stagesCount?: number;
}

export function RankingPage() {
    const { companyName } = useParams();
    const [searchParams] = useSearchParams();
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'stage' | 'general'>('stage');
    const [stageRanking, setStageRanking] = useState<TeamRanking[]>([]);
    const [generalRanking, setGeneralRanking] = useState<TeamRanking[]>([]);
    const [loading, setLoading] = useState(false);
    const [biggestBlue, setBiggestBlue] = useState<{ team: string; size: number } | null>(null);
    const [biggestYellow, setBiggestYellow] = useState<{ team: string; size: number } | null>(null);

    useEffect(() => {
        loadCompanyAndCircuits();
    }, [companyName]);

    useEffect(() => {
        if (selectedCircuit) {
            loadStages();
            loadGeneralRanking();
        }
    }, [selectedCircuit]);

    useEffect(() => {
        if (selectedStage) {
            loadStageRanking();
            setActiveTab('stage'); // Auto switch to stage tab if stage is selected manually or via param
        } else if (stages.length > 0 && !selectedStage) {
            // If stages loaded but none selected, check params again or default
            const paramStageId = searchParams.get('stageId');
            if (paramStageId) {
                const stageExists = stages.find(s => s.id === paramStageId);
                if (stageExists) setSelectedStage(paramStageId);
            } else {
                setSelectedStage(stages[0].id);
            }
        }
    }, [selectedStage, stages]);


    const loadCompanyAndCircuits = async () => {
        let currentCompanyId: string | null = null;

        // Se tem slug na URL buscar company_id
        if (companyName) {
            const { data: company } = await supabase
                .from('users')
                .select('id')
                .eq('slug', companyName)
                .single();

            if (company) {
                currentCompanyId = company.id;
            } else {
                console.error('Empresa não encontrada:', companyName);
                return;
            }
        }

        // Buscar circuitos filtrados por company_id
        let query = supabase
            .from('circuits')
            .select('*')
            .eq('active', true);

        if (currentCompanyId) {
            query = query.eq('company_id', currentCompanyId);
        }

        const { data } = await query.order('year', { ascending: false });

        if (data) {
            const circuits = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                year: item.year,
                description: item.description,
                active: item.active,
                createdAt: new Date(item.created_at),
            }));
            setCircuits(circuits);
            setCircuits(circuits);
            if (circuits.length > 0) {
                const paramCircuitId = searchParams.get('circuitId');
                const found = circuits.find((c: any) => c.id === paramCircuitId);
                setSelectedCircuit(found ? found.id : circuits[0].id);
            }
        }
    };

    const loadStages = async () => {
        const { data } = await supabase
            .from('stages')
            .select('*')
            .eq('circuit_id', selectedCircuit)
            .order('date', { ascending: true });

        if (data) {
            const stages = data.map((item: any) => {
                // Corrige problema de fuso horário: adiciona T12:00:00 para evitar que a data "pule" um dia
                const parseDate = (dateStr: string) => {
                    if (!dateStr) return new Date();
                    // Se for apenas data (YYYY-MM-DD), adiciona horário meio-dia
                    if (dateStr.length === 10) {
                        return new Date(dateStr + 'T12:00:00');
                    }
                    return new Date(dateStr);
                };

                return {
                    id: item.id,
                    circuitId: item.circuit_id,
                    name: item.name,
                    location: item.location,
                    date: parseDate(item.date),
                    registrationDeadline: parseDate(item.registration_deadline),
                    registrationFee: item.registration_fee || 0,
                    active: item.active,
                    status: item.status || 'upcoming',
                    createdAt: new Date(item.created_at),
                };
            });
            setStages(stages);
            if (stages.length > 0) {
                setSelectedStage(stages[0].id);
            }
        }
    };

    const loadStageRanking = async () => {
        setLoading(true);
        try {
            // Buscar resultados da etapa
            const { data: results } = await supabase
                .from('results')
                .select('*, team:teams(*)')
                .eq('stage_id', selectedStage);

            if (results) {
                // Ranking por média
                const ranking = results
                    .filter((r: any) => r.average_score > 0)
                    .map((r: any) => ({
                        teamName: r.team.team_name,
                        city: r.team.city,
                        score: r.average_score,
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);

                setStageRanking(ranking);

                // Maiores peixes
                const blues = results.filter((r: any) => r.biggest_blue > 0);
                const yellows = results.filter((r: any) => r.biggest_yellow > 0);

                if (blues.length > 0) {
                    const maxBlue = blues.reduce((max, r) =>
                        r.biggest_blue > max.biggest_blue ? r : max
                    );
                    setBiggestBlue({
                        team: maxBlue.team.team_name,
                        size: maxBlue.biggest_blue,
                    });
                }

                if (yellows.length > 0) {
                    const maxYellow = yellows.reduce((max, r) =>
                        r.biggest_yellow > max.biggest_yellow ? r : max
                    );
                    setBiggestYellow({
                        team: maxYellow.team.team_name,
                        size: maxYellow.biggest_yellow,
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar ranking da etapa:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGeneralRanking = async () => {
        setLoading(true);
        try {
            // Buscar todos os resultados do circuito
            const { data: stagesData } = await supabase
                .from('stages')
                .select('id')
                .eq('circuit_id', selectedCircuit);

            if (!stagesData || stagesData.length === 0) {
                setGeneralRanking([]);
                setLoading(false);
                return;
            }

            const stageIds = stagesData.map(s => s.id);

            const { data: results } = await supabase
                .from('results')
                .select('*, team:teams(*)')
                .in('stage_id', stageIds);

            if (results) {
                // Agrupar por equipe e somar totais
                const teamTotals = new Map<string, { teamName: string; city: string; total: number; count: number }>();

                results.forEach((r: any) => {
                    const teamId = r.team_id;
                    const total = r.fish_measurements.reduce((sum: number, m: number) => sum + (m || 0), 0);

                    if (teamTotals.has(teamId)) {
                        const existing = teamTotals.get(teamId)!;
                        existing.total += total;
                        existing.count += 1;
                    } else {
                        teamTotals.set(teamId, {
                            teamName: r.team.team_name,
                            city: r.team.city,
                            total: total,
                            count: 1,
                        });
                    }
                });

                // Converter para array e ordenar
                const ranking = Array.from(teamTotals.values())
                    .map(t => ({
                        teamName: t.teamName,
                        city: t.city,
                        score: t.total,
                        stagesCount: t.count,
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 20);

                setGeneralRanking(ranking);
            }
        } catch (error) {
            console.error('Erro ao carregar ranking geral:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">🏆 Rankings</h1>

                    {/* Seletor de Circuito */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Circuito
                            </label>
                            <select
                                value={selectedCircuit}
                                onChange={(e) => setSelectedCircuit(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {circuits.map(circuit => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name} - {circuit.year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-4 mt-6">
                <div className="flex border-b border-gray-300">
                    <button
                        onClick={() => setActiveTab('stage')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'stage'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Classificação de Etapa
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === 'general'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Classificação Geral
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Carregando...</p>
                    </div>
                ) : activeTab === 'stage' ? (
                    <>
                        {/* Seletor de Etapa */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selecione a Etapa
                            </label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name} - {stage.location} ({stage.date.toLocaleDateString('pt-BR')})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Maiores Peixes */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <h3 className="font-bold text-blue-800 mb-2">🔵 Maior Peixe Azul</h3>
                                {biggestBlue ? (
                                    <>
                                        <p className="text-2xl font-bold text-blue-900">{biggestBlue.size.toFixed(1)} cm</p>
                                        <p className="text-blue-700">{biggestBlue.team}</p>
                                    </>
                                ) : (
                                    <p className="text-blue-600">Nenhum registro</p>
                                )}
                            </div>

                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                                <h3 className="font-bold text-yellow-800 mb-2">🟡 Maior Peixe Amarelo</h3>
                                {biggestYellow ? (
                                    <>
                                        <p className="text-2xl font-bold text-yellow-900">{biggestYellow.size.toFixed(1)} cm</p>
                                        <p className="text-yellow-700">{biggestYellow.team}</p>
                                    </>
                                ) : (
                                    <p className="text-yellow-600">Nenhum registro</p>
                                )}
                            </div>
                        </div>

                        {/* Tabela de Ranking */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                                <table className="w-full">
                                    <thead className="bg-gray-800 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Posição</th>
                                            <th className="px-4 py-3 text-left">Equipe</th>
                                            <th className="px-4 py-3 text-left">Cidade</th>
                                            <th className="px-4 py-3 text-right">Média</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {stageRanking.map((team, index) => (
                                            <tr key={index} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                                                <td className="px-4 py-3 font-bold">
                                                    {index + 1}º
                                                    {index === 0 && ' 🥇'}
                                                    {index === 1 && ' 🥈'}
                                                    {index === 2 && ' 🥉'}
                                                </td>
                                                <td className="px-4 py-3 font-medium">{team.teamName}</td>
                                                <td className="px-4 py-3 text-gray-600">{team.city}</td>
                                                <td className="px-4 py-3 text-right font-bold text-blue-600">
                                                    {team.score.toFixed(2)} cm
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Classificação Geral */
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
                            <table className="w-full">
                                <thead className="bg-gray-800 text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Posição</th>
                                        <th className="px-4 py-3 text-left">Equipe</th>
                                        <th className="px-4 py-3 text-left">Cidade</th>
                                        <th className="px-4 py-3 text-center">Etapas</th>
                                        <th className="px-4 py-3 text-right">Total Geral</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {generalRanking.map((team, index) => (
                                        <tr key={index} className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                                            <td className="px-4 py-3 font-bold">
                                                {index + 1}º
                                                {index === 0 && ' 🥇'}
                                                {index === 1 && ' 🥈'}
                                                {index === 2 && ' 🥉'}
                                            </td>
                                            <td className="px-4 py-3 font-medium">{team.teamName}</td>
                                            <td className="px-4 py-3 text-gray-600">{team.city}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{team.stagesCount}</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600">
                                                {team.score.toFixed(1)} cm
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
