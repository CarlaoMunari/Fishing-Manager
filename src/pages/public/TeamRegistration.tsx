import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Stage, TeamMember, Team } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/public/Navbar';
import { Users, Search, UserPlus } from 'lucide-react';

export function TeamRegistration() {
    const { stageId, companyName } = useParams<{ stageId: string; companyName?: string }>();
    const navigate = useNavigate();
    const [stage, setStage] = useState<Stage | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Team search state
    const [searchMode, setSearchMode] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Team[]>([]);
    const [selectedExistingTeam, setSelectedExistingTeam] = useState<Team | null>(null);
    const [searching, setSearching] = useState(false);

    // Form state - Dados da Equipe
    const [teamName, setTeamName] = useState('');
    const [city, setCity] = useState('');

    // Form state - Dados do Responsável
    const [responsibleName, setResponsibleName] = useState('');
    const [responsibleEmail, setResponsibleEmail] = useState('');
    const [responsiblePhone, setResponsiblePhone] = useState('');
    const [responsiblePhone2, setResponsiblePhone2] = useState('');

    // Form state - Integrantes (4 fixos)
    const [members, setMembers] = useState<TeamMember[]>([
        { name: '', nickname: '', rg: '' }, // Capitão
        { name: '', nickname: '', rg: '' }, // Pescador 1
        { name: '', nickname: '', rg: '' }, // Pescador 2
        { name: '', nickname: '', rg: '' }, // Reserva
    ]);

    const [error, setError] = useState('');

    const memberLabels = ['Capitão', 'Pescador 1', 'Pescador 2', 'Reserva'];

    useEffect(() => {
        loadStage();
    }, [stageId]);

    const searchTeams = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .ilike('team_name', `%${searchQuery}%`)
                .limit(5);

            if (error) throw error;

            if (data) {
                const teams = data.map((item: any) => ({
                    id: item.id,
                    stageId: item.stage_id,
                    teamName: item.team_name,
                    city: item.city,
                    responsibleName: item.responsible_name,
                    responsibleEmail: item.responsible_email,
                    responsiblePhone: item.responsible_phone,
                    responsiblePhone2: item.responsible_phone2,
                    members: item.members,
                    paid: item.paid,
                    registeredAt: new Date(item.created_at),
                }));
                setSearchResults(teams);
            }
        } catch (error) {
            console.error('Erro ao buscar equipes:', error);
        } finally {
            setSearching(false);
        }
    };

    const selectExistingTeam = (team: Team) => {
        setSelectedExistingTeam(team);
        setTeamName(team.teamName);
        setCity(team.city);
        setResponsibleName(team.responsibleName);
        setResponsibleEmail(team.responsibleEmail);
        setResponsiblePhone(team.responsiblePhone);
        setResponsiblePhone2(team.responsiblePhone2 || '');
        setMembers(team.members);
        setSearchMode(false);
        setSearchResults([]);
    };

    const resetToNewTeam = () => {
        setSelectedExistingTeam(null);
        setSearchMode(false);
        setSearchQuery('');
        setSearchResults([]);
        setTeamName('');
        setCity('');
        setResponsibleName('');
        setResponsibleEmail('');
        setResponsiblePhone('');
        setResponsiblePhone2('');
        setMembers([
            { name: '', nickname: '', rg: '' },
            { name: '', nickname: '', rg: '' },
            { name: '', nickname: '', rg: '' },
            { name: '', nickname: '', rg: '' },
        ]);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchMode && searchQuery) {
                searchTeams();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchMode]);

    const loadStage = async () => {
        if (!stageId) return;
        try {
            const { data, error } = await supabase
                .from('stages')
                .select('*')
                .eq('id', stageId)
                .single();

            if (error) throw error;

            if (data) {
                setStage({
                    id: data.id,
                    circuitId: data.circuit_id,
                    companyId: data.company_id, // IMPORTANTE: Incluir para pagamentos
                    name: data.name,
                    date: new Date(data.date),
                    location: data.location,
                    registrationFee: data.registration_fee,
                    imageUrl: data.image_url,
                    createdAt: new Date(data.created_at),
                } as Stage);
            }
        } catch (error) {
            console.error('Erro ao carregar etapa:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateMember = (index: number, field: keyof TeamMember, value: string) => {
        const updated = [...members];
        updated[index] = { ...updated[index], [field]: value };
        setMembers(updated);
    };

    const validateForm = async (): Promise<boolean> => {
        setError('');
        // Validação removida para permitir fluxo fluido
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!await validateForm()) return;

        setSubmitting(true);
        setError('');

        try {
            // Verificar se já existe equipe com mesmo nome nesta etapa
            const { data: existingTeam } = await supabase
                .from('teams')
                .select('id')
                .eq('stage_id', stageId)
                .ilike('team_name', teamName.trim())
                .maybeSingle();

            let teamId;

            const teamData = {
                stage_id: stageId,
                team_name: teamName.trim(),
                city: city.trim(),
                responsible_name: responsibleName.trim(),
                responsible_email: responsibleEmail.trim(),
                responsible_phone: responsiblePhone.trim(),
                responsible_phone2: responsiblePhone2.trim() || null,
                members: members,
                // Não alteramos o status de pagamento aqui
            };

            if (existingTeam) {
                // Se existe, ATUALIZA os dados (Modo Edição/Correção)
                const { error: updateError } = await supabase
                    .from('teams')
                    .update(teamData)
                    .eq('id', existingTeam.id);

                if (updateError) throw updateError;
                teamId = existingTeam.id;
            } else {
                // Se não existe, CRIA nova equipe
                const { data: newTeam, error: insertError } = await supabase
                    .from('teams')
                    .insert({ ...teamData, paid: false })
                    .select()
                    .single();

                if (insertError) throw insertError;
                teamId = newTeam.id;
            }

            // Gerar chave de acesso GPS para a equipe
            try {
                const { createGPSAccessKey } = await import('@/lib/gps');
                const { data: gpsKey, error: gpsError } = await createGPSAccessKey(teamId, stageId!);

                if (gpsError) {
                    console.error('Erro ao gerar chave GPS:', gpsError);
                } else if (gpsKey) {
                    console.log('Chave GPS gerada:', gpsKey.access_key);
                }
            } catch (gpsError) {
                console.error('Erro ao gerar chave GPS:', gpsError);
                // Não bloquear o fluxo se falhar
            }

            // Buscar dados atualizados para passar pro checkout
            const { data: finalTeam, error: fetchError } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamId)
                .single();

            if (fetchError) throw fetchError;

            if (!stage) {
                throw new Error('Dados da etapa não encontrados');
            }

            // Garantir que o stage tenha todos os dados necessários
            const stageData = {
                id: stage.id,
                circuitId: stage.circuitId,
                companyId: stage.companyId,
                name: stage.name,
                date: stage.date,
                location: stage.location,
                registrationFee: stage.registrationFee,
                imageUrl: stage.imageUrl,
                createdAt: stage.createdAt
            };

            // Redirect to checkout
            const checkoutPath = companyName ? `/${companyName}/checkout` : '/checkout';
            navigate(checkoutPath, { state: { team: finalTeam, stage: stageData } });

        } catch (error) {
            console.error('Erro ao registrar/atualizar equipe:', error);
            setError('Erro ao processar inscrição. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            </>
        );
    }

    if (!stage) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Card>
                        <p className="text-center text-gray-600">Etapa não encontrada</p>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Inscrição de Equipe
                        </h1>
                        <p className="text-gray-600">
                            {stage.name} - {stage.location}
                        </p>
                        <p className="text-ocean-600 font-semibold">
                            Taxa de inscrição: R$ {stage.registrationFee.toFixed(2)}
                        </p>
                    </div>

                    {/* Team Search Section */}
                    {searchMode ? (
                        <Card className="mb-8 bg-blue-50 border-2 border-blue-200">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-xl font-bold text-gray-900">Buscar Equipe Existente</h2>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Se sua equipe já está cadastrada, busque pelo nome para reutilizar os dados.
                                </p>
                                <div className="flex gap-3">
                                    <div className="flex-grow">
                                        <Input
                                            label=""
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Digite o nome da equipe..."
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={resetToNewTeam}
                                        className="mt-0 bg-green-600 hover:bg-green-700"
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Cadastrar Nova Equipe
                                    </Button>
                                </div>

                                {/* Search Results */}
                                {searching && (
                                    <div className="text-center py-4">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                )}
                                {!searching && searchResults.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        <p className="text-sm font-medium text-gray-700">Equipes encontradas:</p>
                                        {searchResults.map((team) => (
                                            <div
                                                key={team.id}
                                                onClick={() => selectExistingTeam(team)}
                                                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{team.teamName}</p>
                                                        <p className="text-sm text-gray-600">{team.city}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Responsável: {team.responsibleName}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            selectExistingTeam(team);
                                                        }}
                                                    >
                                                        Selecionar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!searching && searchQuery && searchResults.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Nenhuma equipe encontrada. Use o botão "Cadastrar Nova Equipe" acima.
                                    </p>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <div className="mb-6 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    {selectedExistingTeam ? (
                                        <span>Usando dados da equipe: <strong>{selectedExistingTeam.teamName}</strong></span>
                                    ) : (
                                        <span>Cadastrando nova equipe</span>
                                    )}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSearchMode(true);
                                    setSelectedExistingTeam(null);
                                }}
                            >
                                Voltar para Busca
                            </Button>
                        </div>
                    )}

                    {!searchMode && (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Seção 1: Dados da Equipe */}
                            <Card>
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Dados da Equipe
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Nome da Equipe"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="Ex: Equipe Tucunaré"
                                    />
                                    <Input
                                        label="Cidade"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Ex: São Paulo"
                                    />
                                </div>
                            </Card>

                            {/* Seção 2: Dados do Responsável */}
                            <Card>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Dados do Responsável
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Nome Completo"
                                        value={responsibleName}
                                        onChange={(e) => setResponsibleName(e.target.value)}
                                        placeholder="Nome do responsável (Capitão)"
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={responsibleEmail}
                                        onChange={(e) => setResponsibleEmail(e.target.value)}
                                        placeholder="email@exemplo.com"
                                    />
                                    <Input
                                        label="Telefone Principal"
                                        value={responsiblePhone}
                                        onChange={(e) => setResponsiblePhone(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                    />
                                    <Input
                                        label="Telefone Secundário (Opcional)"
                                        value={responsiblePhone2}
                                        onChange={(e) => setResponsiblePhone2(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </Card>

                            {/* Seção 3: Integrantes */}
                            <Card>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Integrantes da Equipe
                                </h2>
                                <div className="space-y-6">
                                    {members.map((member, index) => (
                                        <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                                            <h3 className="text-lg font-semibold text-ocean-700 mb-3">
                                                {memberLabels[index]}
                                            </h3>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <Input
                                                    label="Nome Completo"
                                                    value={member.name}
                                                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                                                    placeholder="Nome completo"
                                                />
                                                <Input
                                                    label="Apelido"
                                                    value={member.nickname}
                                                    onChange={(e) => updateMember(index, 'nickname', e.target.value)}
                                                    placeholder="Apelido"
                                                />
                                                <Input
                                                    label="RG"
                                                    value={member.rg}
                                                    onChange={(e) => updateMember(index, 'rg', e.target.value)}
                                                    placeholder="00.000.000-0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Error message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            {/* Submit button */}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={submitting}
                                    className="px-8"
                                >
                                    Continuar para Pagamento
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
