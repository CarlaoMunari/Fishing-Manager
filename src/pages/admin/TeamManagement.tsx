import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, CheckCircle, XCircle, Clock, DollarSign, Trash2, Edit2, Save, X, PlusCircle } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

interface TeamWithPayment {
    id: string;
    teamName: string;
    city: string;
    responsibleName: string;
    responsibleEmail: string;
    stageName: string;
    paymentStatus: 'pending' | 'paid' | 'rejected' | 'none';
    paymentMethod: string;
    registeredAt: Date;
}

export function TeamManagement() {
    const { companyId } = useCompany();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<TeamWithPayment[]>([]);
    const [circuits, setCircuits] = useState<any[]>([]);
    const [stages, setStages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<{ id: string, name: string } | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<TeamWithPayment | null>(null);
    const [editForm, setEditForm] = useState({
        teamName: '',
        responsibleName: '',
        responsibleEmail: '',
        city: '',
        phone: '' // Added phone though it wasn't in original type, will check if needed or add to type
    });

    const [selectedCircuit, setSelectedCircuit] = useState('');
    const [selectedStage, setSelectedStage] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadCircuits();
    }, [companyId]);

    useEffect(() => {
        if (selectedCircuit) {
            loadStages(selectedCircuit);
        } else {
            setStages([]);
            setSelectedStage('');
        }
    }, [selectedCircuit]);

    useEffect(() => {
        if (selectedStage) {
            loadTeams();
        } else {
            setTeams([]);
        }
    }, [selectedStage, filterStatus]);

    const loadCircuits = async () => {
        try {
            let query = supabase
                .from('circuits')
                .select('id, name, year')
                .eq('active', true)
                .order('year', { ascending: false });

            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query;
            if (error) throw error;

            setCircuits(data || []);
            if (data && data.length > 0) {
                setSelectedCircuit(data[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar circuitos:', error);
        }
    };

    const loadStages = async (circuitId: string) => {
        try {
            const { data, error } = await supabase
                .from('stages')
                .select('id, name, date')
                .eq('circuit_id', circuitId)
                .order('date', { ascending: false });

            if (error) throw error;

            setStages(data || []);
            if (data && data.length > 0) {
                setSelectedStage(data[0].id);
            }
        } catch (error) {
            console.error('Erro ao carregar etapas:', error);
        }
    };

    const loadTeams = async () => {
        setLoading(true);
        try {
            // Buscar equipes e seus pagamentos
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select(`
                    id,
                    team_name,
                    city,
                    responsible_name,
                    responsible_email,
                    responsible_phone,
                    created_at,
                    stages (name)
                `)
                .eq('stage_id', selectedStage);

            if (teamsError) throw teamsError;

            // Buscar pagamentos
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('team_id, status, payment_method')
                .eq('stage_id', selectedStage);

            if (paymentsError) throw paymentsError;

            // Mapear pagamentos por team_id
            const paymentMap = new Map();
            paymentsData?.forEach(p => {
                paymentMap.set(p.team_id, {
                    status: p.status,
                    method: p.payment_method
                });
            });

            // Combinar dados
            const teamsWithPayment: TeamWithPayment[] = (teamsData || []).map((team: any) => {
                const payment = paymentMap.get(team.id);
                return {
                    id: team.id,
                    teamName: team.team_name || '',
                    city: team.city || '',
                    responsibleName: team.responsible_name || '',
                    responsibleEmail: team.responsible_email || '',
                    responsiblePhone: team.responsible_phone || '',
                    stageName: team.stages?.name || '',
                    paymentStatus: payment?.status || 'none',
                    paymentMethod: payment?.method || '-',
                    registeredAt: new Date(team.created_at)
                };
            });

            // Aplicar filtro de status
            let filtered = teamsWithPayment;
            if (filterStatus !== 'all') {
                filtered = teamsWithPayment.filter(t => t.paymentStatus === filterStatus);
            }

            setTeams(filtered);
        } catch (error) {
            console.error('Erro ao carregar equipes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (teamId: string, teamName: string) => {
        setTeamToDelete({ id: teamId, name: teamName });
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteTeam = async () => {
        if (!teamToDelete) return;

        try {
            // Delete payments first (foreign key constraint)
            const { error: paymentError } = await supabase
                .from('payments')
                .delete()
                .eq('team_id', teamToDelete.id);

            if (paymentError) throw paymentError;

            // Delete team
            const { error: teamError } = await supabase
                .from('teams')
                .delete()
                .eq('id', teamToDelete.id);

            if (teamError) throw teamError;

            // Refresh list
            loadTeams();
            setIsDeleteModalOpen(false);
            setTeamToDelete(null);
        } catch (error) {
            console.error('Erro ao deletar equipe:', error);
            alert('Erro ao deletar equipe.');
        }
    };

    const handleEditClick = (team: TeamWithPayment) => {
        setEditingTeam(team);
        setEditForm({
            teamName: team.teamName,
            responsibleName: team.responsibleName,
            responsibleEmail: team.responsibleEmail,
            city: team.city,
            phone: (team as any).responsiblePhone || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTeam) return;

        try {
            const { error } = await supabase
                .from('teams')
                .update({
                    team_name: editForm.teamName,
                    responsible_name: editForm.responsibleName,
                    responsible_email: editForm.responsibleEmail,
                    city: editForm.city,
                    responsible_phone: editForm.phone
                })
                .eq('id', editingTeam.id);

            if (error) throw error;

            setIsEditModalOpen(false);
            setEditingTeam(null);
            loadTeams();
        } catch (error) {
            console.error('Erro ao atualizar equipe:', error);
            alert('Erro ao atualizar equipe.');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pendente' },
            paid: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Pago' },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejeitado' },
            none: { bg: 'bg-gray-100', text: 'text-gray-800', icon: DollarSign, label: 'Sem Pagamento' }
        };

        const style = styles[status as keyof typeof styles] || styles.none;
        const Icon = style.icon;

        return (
            <div className={`flex items-center gap-1 px-2 py-1 ${style.bg} ${style.text} rounded-full text-xs font-semibold`}>
                <Icon className="w-3 h-3" />
                {style.label}
            </div>
        );
    };

    const handleNewRegistration = () => {
        if (selectedStage) {
            navigate(`/register/${selectedStage}`);
        } else {
            alert('Selecione uma etapa primeiro');
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inscrições de Equipes</h1>
                        <p className="text-gray-600 mt-1">Gerencie as equipes inscritas e seus pagamentos</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-gray-600">
                                {teams.length} {teams.length === 1 ? 'equipe' : 'equipes'}
                            </span>
                        </div>
                        <button
                            onClick={handleNewRegistration}
                            disabled={!selectedStage}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                            title={!selectedStage ? "Selecione uma etapa primeiro" : "Criar nova inscrição"}
                        >
                            <PlusCircle className="w-4 h-4" />
                            Nova Inscrição
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Circuito
                            </label>
                            <select
                                value={selectedCircuit}
                                onChange={(e) => setSelectedCircuit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                {circuits.map(circuit => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name} - {circuit.year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Etapa
                            </label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                disabled={!selectedCircuit}
                            >
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name} - {new Date(stage.date).toLocaleDateString('pt-BR')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Pagamento
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todos</option>
                                <option value="pending">Pendentes</option>
                                <option value="paid">Pagos</option>
                                <option value="rejected">Rejeitados</option>
                                <option value="none">Sem Pagamento</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Lista de Equipes */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : teams.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">
                            {selectedStage ? 'Nenhuma equipe inscrita nesta etapa' : 'Selecione uma etapa para ver as inscrições'}
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {teams.map((team) => (
                            <Card key={team.id} className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
                                            {getStatusBadge(team.paymentStatus)}
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                                            <p><strong>Cidade:</strong> {team.city || 'Não informada'}</p>
                                            <p><strong>Responsável:</strong> {team.responsibleName || 'Não informado'}</p>
                                            <p><strong>Email:</strong> {team.responsibleEmail || 'Não informado'}</p>
                                            <p><strong>Método:</strong> {team.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => handleEditClick(team)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Equipe"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(team.id, team.teamName)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Equipe"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">
                                        Inscrito em: {team.registeredAt.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Editar Equipe</h3>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Equipe</label>
                                    <input
                                        type="text"
                                        value={editForm.teamName}
                                        onChange={e => setEditForm({ ...editForm, teamName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                    <input
                                        type="text"
                                        value={editForm.city}
                                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                    <input
                                        type="text"
                                        value={editForm.responsibleName}
                                        onChange={e => setEditForm({ ...editForm, responsibleName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editForm.responsibleEmail}
                                        onChange={e => setEditForm({ ...editForm, responsibleEmail: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && teamToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Equipe?</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir a equipe <strong>{teamToDelete.name}</strong>?
                                <br />Essa ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteTeam}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
