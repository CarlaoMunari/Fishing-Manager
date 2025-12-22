import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Circuit, Stage } from '@/types';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { Calendar, MapPin, Trophy, Users } from 'lucide-react';

export function StagesPage() {
    const { companyName } = useParams();
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCompanyAndCircuits();
    }, [companyName]);

    useEffect(() => {
        if (selectedCircuit && companyId !== undefined) {
            loadStages();
        }
    }, [selectedCircuit, companyId]);

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
                setCompanyId(company.id);
            } else {
                console.error('Empresa não encontrada:', companyName);
                setCompanyId(null);
                return;
            }
        } else {
            setCompanyId(null);
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
            if (circuits.length > 0) {
                setSelectedCircuit(circuits[0].id);
            }
        }
    };

    const loadStages = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('stages')
            .select('*')
            .eq('circuit_id', selectedCircuit)
            .order('date', { ascending: true });

        if (data) {
            const stages = data.map((item: any) => ({
                id: item.id,
                circuitId: item.circuit_id,
                name: item.name,
                location: item.location,
                date: new Date(item.date),
                registrationDeadline: new Date(item.registration_deadline),
                registrationFee: item.registration_fee || 0,
                active: item.active,
                status: item.status || 'upcoming',
                createdAt: new Date(item.created_at),
            }));
            setStages(stages);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Etapas do Circuito</h1>

                    <div className="mt-4 md:mt-0">
                        <select
                            value={selectedCircuit}
                            onChange={(e) => setSelectedCircuit(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                        >
                            {circuits.map(circuit => (
                                <option key={circuit.id} value={circuit.id}>
                                    {circuit.name} - {circuit.year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : stages.length > 0 ? (
                    <div className="grid gap-6">
                        {stages.map((stage) => (
                            <div key={stage.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row">
                                {/* Date Box */}
                                <div className="bg-slate-900 text-white p-6 flex flex-col items-center justify-center min-w-[120px]">
                                    <span className="text-3xl font-bold">{stage.date.getDate()}</span>
                                    <span className="text-sm uppercase tracking-wider">
                                        {stage.date.toLocaleDateString('pt-BR', { month: 'short' })}
                                    </span>
                                    <span className="text-xs opacity-75 mt-1">{stage.date.getFullYear()}</span>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-grow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{stage.name}</h3>
                                        <div className="flex items-center text-gray-600 mb-1">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            {stage.location}
                                        </div>
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                            {stage.date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                        {stage.status === 'finished' ? (
                                            <Link
                                                to="/ranking"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-900/20"
                                            >
                                                <Trophy className="w-4 h-4" />
                                                Classificação
                                            </Link>
                                        ) : (
                                            <Link
                                                to={`/register/${stage.id}`}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-900/20"
                                            >
                                                <Users className="w-4 h-4" />
                                                Inscreva-se
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-lg">Nenhuma etapa encontrada para este circuito.</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
