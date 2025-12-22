import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Circuit, Stage } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MapPin, Calendar, DollarSign, Trophy } from 'lucide-react';

export function CircuitList() {
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [stages, setStages] = useState<Record<string, Stage[]>>({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCircuitsAndStages();
    }, []);

    const loadCircuitsAndStages = async () => {
        try {
            // Load active circuits
            const { data: circuitsData, error: circuitsError } = await supabase
                .from('circuits')
                .select('*')
                .eq('active', true)
                .order('year', { ascending: false });

            if (circuitsError) throw circuitsError;

            const loadedCircuits = circuitsData.map((item: any) => ({
                ...item,
                createdAt: new Date(item.created_at),
            })) as Circuit[];
            setCircuits(loadedCircuits);

            // Load stages for each circuit
            const stagesData: Record<string, Stage[]> = {};
            for (const circuit of loadedCircuits) {
                const { data: stagesResult, error: stagesError } = await supabase
                    .from('stages')
                    .select('*')
                    .eq('circuit_id', circuit.id)
                    .order('date', { ascending: true });

                if (stagesError) throw stagesError;

                stagesData[circuit.id] = stagesResult.map((item: any) => ({
                    ...item,
                    circuitId: item.circuit_id,
                    imageUrl: item.image_url,
                    registrationFee: item.registration_fee,
                    date: new Date(item.date),
                    createdAt: new Date(item.created_at),
                })) as Stage[];
            }
            setStages(stagesData);
        } catch (error) {
            console.error('Erro ao carregar circuitos e etapas:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        // Adjust for timezone offset to display correct date
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }).format(adjustedDate);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (circuits.length === 0) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card>
                    <p className="text-center text-gray-600">
                        Nenhum circuito ativo no momento. Volte em breve!
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <Trophy className="w-8 h-8 text-ocean-600" />
                Circuitos Ativos
            </h2>

            <div className="space-y-8">
                {circuits.map(circuit => (
                    <Card key={circuit.id}>
                        <h3 className="text-2xl font-bold text-ocean-800 mb-4">
                            {circuit.name}
                        </h3>

                        {stages[circuit.id]?.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {stages[circuit.id].map(stage => (
                                    <div
                                        key={stage.id}
                                        className="border border-gray-200 rounded-lg overflow-hidden hover:border-ocean-400 hover:shadow-md transition-all"
                                    >
                                        {stage.imageUrl && (
                                            <img
                                                src={stage.imageUrl}
                                                alt={stage.name}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        )}

                                        <div className="p-4">
                                            <h4 className="font-semibold text-lg text-gray-900 mb-3">
                                                {stage.name}
                                            </h4>

                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(stage.date)}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    {stage.location}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm font-semibold text-fishing-700">
                                                    <DollarSign className="w-4 h-4" />
                                                    {formatCurrency(stage.registrationFee)}
                                                </div>
                                            </div>

                                            <Button
                                                variant="primary"
                                                onClick={() => navigate(`/register/${stage.id}`)}
                                                className="w-full"
                                            >
                                                Inscrever Equipe
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">
                                Nenhuma etapa cadastrada para este circuito ainda.
                            </p>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
