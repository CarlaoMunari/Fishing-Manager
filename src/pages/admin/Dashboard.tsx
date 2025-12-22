import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trophy, MapPin, Users } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
    const { companyId } = useCompany();
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        circuits: 0,
        stages: 0,
        teams: 0,
        results: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [companyId]);

    const loadStats = async () => {
        try {
            console.log('📊 Dashboard loadStats - companyId:', companyId);

            // Base queries
            const circuitsQuery = supabase.from('circuits').select('*', { count: 'exact', head: true });
            const stagesQuery = supabase.from('stages').select('*', { count: 'exact', head: true });

            // Filtrar por company_id se não for super_admin
            if (companyId) {
                circuitsQuery.eq('company_id', companyId);
                stagesQuery.eq('company_id', companyId);
            }

            const [circuitsCount, stagesCount] = await Promise.all([
                circuitsQuery,
                stagesQuery,
            ]);

            console.log('📊 Circuits:', circuitsCount.count, 'Stages:', stagesCount.count);

            // Teams e Results: não têm company_id direto,
            // precisam buscar através das stages
            let teamsCount = 0;
            let resultsCount = 0;

            if (companyId) {
                // Buscar IDs das stages desta empresa
                const { data: companyStages } = await supabase
                    .from('stages')
                    .select('id')
                    .eq('company_id', companyId);

                console.log('📊 Company stages:', companyStages?.length, companyStages);

                if (companyStages && companyStages.length > 0) {
                    const stageIds = companyStages.map(s => s.id);

                    // Contar teams
                    const { count: teamsC } = await supabase
                        .from('teams')
                        .select('*', { count: 'exact', head: true })
                        .in('stage_id', stageIds);
                    teamsCount = teamsC || 0;

                    // Contar results
                    const { count: resultsC } = await supabase
                        .from('results')
                        .select('*', { count: 'exact', head: true })
                        .in('stage_id', stageIds);
                    resultsCount = resultsC || 0;

                    console.log('📊 Teams (via stages):', teamsCount, 'Results:', resultsCount);
                }
            } else {
                // Super admin: contar tudo
                const { count: teamsC } = await supabase
                    .from('teams')
                    .select('*', { count: 'exact', head: true });
                teamsCount = teamsC || 0;

                const { count: resultsC } = await supabase
                    .from('results')
                    .select('*', { count: 'exact', head: true });
                resultsCount = resultsC || 0;

                console.log('📊 Teams (super admin):', teamsCount, 'Results:', resultsCount);
            }

            setStats({
                circuits: circuitsCount.count || 0,
                stages: stagesCount.count || 0,
                teams: teamsCount,
                results: resultsCount,
            });
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            icon: Trophy,
            label: 'Circuitos',
            value: stats.circuits,
            color: 'text-ocean-600',
            bg: 'bg-ocean-50',
        },
        {
            icon: MapPin,
            label: 'Etapas',
            value: stats.stages,
            color: 'text-fishing-600',
            bg: 'bg-fishing-50',
        },
        {
            icon: Users,
            label: 'Equipes Inscritas',
            value: stats.teams,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    ];

    if (loading) {
        return (
            <AdminLayout>
                <LoadingSpinner size="lg" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    {currentUser?.role === 'company' && currentUser.name && (
                        <p className="text-gray-600 mt-2">
                            Bem-vindo, <span className="font-semibold">{currentUser.name}</span>!
                        </p>
                    )}
                    {currentUser?.role === 'super_admin' && (
                        <p className="text-gray-600 mt-2">
                            Visualizando <span className="font-semibold">todos os dados</span> do sistema
                        </p>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    {statCards.map((stat) => (
                        <Card key={stat.label}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Card>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {currentUser?.role === 'company'
                            ? 'Gerencie seu Circuito'
                            : 'Bem-vindo ao Painel Administrativo'}
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Use o menu lateral para navegar pelas diferentes funcionalidades do sistema:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        {currentUser?.role === 'super_admin' && (
                            <li><strong>Empresas:</strong> Gerencie as empresas cadastradas no sistema</li>
                        )}
                        <li><strong>Carrossel:</strong> Gerencie as imagens da página inicial</li>
                        <li><strong>Circuitos:</strong> Cadastre e gerencie circuitos de pesca</li>
                        <li><strong>Etapas:</strong> Cadastre etapas vinculadas aos circuitos</li>
                        <li><strong>Inscrições:</strong> Visualize as equipes inscritas</li>
                        <li><strong>Lançar Medidas:</strong> Registre as medidas dos peixes capturados</li>
                        <li><strong>Rankings:</strong> Visualize classificações por etapa e circuito</li>
                        {currentUser?.role === 'company' && currentUser.slug && (
                            <li>
                                <strong>Seu Site:</strong>
                                <a
                                    href={`/${currentUser.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                >
                                    Visualizar Homepage Pública
                                </a>
                            </li>
                        )}
                    </ul>
                </Card>
            </div>
        </AdminLayout>
    );
}
