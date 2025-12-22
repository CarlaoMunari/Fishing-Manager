import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Circuit, Stage } from '@/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign, Upload } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

export function StageManagement() {
    const { companyId } = useCompany();
    const { currentUser } = useAuth();
    const [stages, setStages] = useState<Stage[]>([]);
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<Stage | null>(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [stageToDelete, setStageToDelete] = useState<string | null>(null);

    // Form state
    const [circuitId, setCircuitId] = useState('');
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [registrationFee, setRegistrationFee] = useState(0);
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // GPS Form state
    const [gpsTrackingEnabled, setGpsTrackingEnabled] = useState(false);
    const [gpsStartTime, setGpsStartTime] = useState('07:00');
    const [gpsEndTime, setGpsEndTime] = useState('21:00');
    const [gpsUpdateInterval, setGpsUpdateInterval] = useState(30);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Build queries with company_id filter
            let circuitsQuery = supabase.from('circuits').select('*');
            let stagesQuery = supabase.from('stages').select('*');

            if (companyId) {
                circuitsQuery = circuitsQuery.eq('company_id', companyId);
                stagesQuery = stagesQuery.eq('company_id', companyId);
            }

            const [circuitsResponse, stagesResponse] = await Promise.all([
                circuitsQuery,
                stagesQuery,
            ]);

            if (circuitsResponse.error) throw circuitsResponse.error;
            if (stagesResponse.error) throw stagesResponse.error;

            const loadedCircuits = circuitsResponse.data.map((data: any) => ({
                ...data,
                companyId: data.company_id,
                createdAt: new Date(data.created_at),
            })) as Circuit[];
            setCircuits(loadedCircuits);

            const loadedStages = stagesResponse.data.map((data: any) => ({
                ...data,
                circuitId: data.circuit_id,
                imageUrl: data.image_url,
                registrationFee: data.registration_fee,
                date: new Date(data.date), // Supabase date string to Date object
                createdAt: new Date(data.created_at),
                gpsTrackingEnabled: data.gps_tracking_enabled || false,
                gpsStartTime: data.gps_start_time || '07:00',
                gpsEndTime: data.gps_end_time || '21:00',
                gpsUpdateInterval: data.gps_update_interval || 30,
            })) as Stage[];
            setStages(loadedStages.sort((a, b) => a.date.getTime() - b.date.getTime()));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (stage?: Stage) => {
        if (stage) {
            setEditingStage(stage);
            setCircuitId(stage.circuitId);
            setName(stage.name);
            setDate(stage.date.toISOString().split('T')[0]);
            setLocation(stage.location);
            setRegistrationFee(stage.registrationFee);
            setImageUrl(stage.imageUrl || '');
            setGpsTrackingEnabled(stage.gpsTrackingEnabled || false);
            setGpsStartTime(stage.gpsStartTime || '07:00');
            setGpsEndTime(stage.gpsEndTime || '21:00');
            setGpsUpdateInterval(stage.gpsUpdateInterval || 30);
        } else {
            setEditingStage(null);
            setCircuitId('');
            setName('');
            setDate('');
            setLocation('');
            setRegistrationFee(0);
            setImageUrl('');
            setGpsTrackingEnabled(false);
            setGpsStartTime('07:00');
            setGpsEndTime('21:00');
            setGpsUpdateInterval(30);
        }
        setSelectedFile(null);
        setModalOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let url = imageUrl;

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `stages/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                url = publicUrl;
            }

            const stageData = {
                circuit_id: circuitId,
                name,
                date: date, // Supabase accepts YYYY-MM-DD string for date type
                location,
                registration_fee: registrationFee,
                image_url: url || null,
                gps_tracking_enabled: gpsTrackingEnabled,
                gps_start_time: gpsTrackingEnabled ? gpsStartTime : null,
                gps_end_time: gpsTrackingEnabled ? gpsEndTime : null,
                gps_update_interval: gpsTrackingEnabled ? gpsUpdateInterval : null,
            };

            if (editingStage) {
                const { error } = await supabase
                    .from('stages')
                    .update(stageData)
                    .eq('id', editingStage.id);
                if (error) throw error;
            } else {
                // Adicionar company_id ao criar nova etapa (herdado do circuito)
                const selectedCircuit = circuits.find(c => c.id === circuitId);
                const targetCompanyId = selectedCircuit?.companyId || companyId || currentUser?.id;

                const insertData = {
                    ...stageData,
                    company_id: targetCompanyId
                };
                const { error } = await supabase
                    .from('stages')
                    .insert(insertData);
                if (error) throw error;
            }
            setModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving stage:', error);
            alert('Erro ao salvar etapa');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setStageToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteStage = async () => {
        if (!stageToDelete) return;

        try {
            const { error } = await supabase
                .from('stages')
                .delete()
                .eq('id', stageToDelete);

            if (error) throw error;

            loadData();
            setIsDeleteModalOpen(false);
            setStageToDelete(null);
        } catch (error) {
            console.error('Error deleting stage:', error);
            alert('Erro ao excluir etapa');
        }
    };

    const getCircuitName = (circuitId: string) => {
        return circuits.find(c => c.id === circuitId)?.name || 'Circuito não encontrado';
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
            <AdminLayout>
                <LoadingSpinner size="lg" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciar Etapas</h1>
                    <Button variant="primary" onClick={() => openModal()}>
                        <Plus className="w-4 h-4" />
                        Nova Etapa
                    </Button>
                </div>

                {stages.length === 0 ? (
                    <Card>
                        <p className="text-center text-gray-600">
                            Nenhuma etapa cadastrada. Crie a primeira!
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {stages.map((stage) => (
                            <Card key={stage.id}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-ocean-100 text-ocean-800 text-sm font-medium rounded-full">
                                                {getCircuitName(stage.circuitId)}
                                            </span>
                                        </div>
                                        <div className="flex gap-4">
                                            {stage.imageUrl && (
                                                <img
                                                    src={stage.imageUrl}
                                                    alt={stage.name}
                                                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                                />
                                            )}
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                                    {stage.name}
                                                </h3>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(stage.date)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        {stage.location}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-fishing-700 font-semibold">
                                                        <DollarSign className="w-4 h-4" />
                                                        {formatCurrency(stage.registrationFee)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-start">
                                        <button
                                            onClick={async () => {
                                                const newStatus = stage.status === 'active' ? 'finished' : 'active';
                                                try {
                                                    const { error } = await supabase
                                                        .from('stages')
                                                        .update({ status: newStatus })
                                                        .eq('id', stage.id);
                                                    if (error) throw error;
                                                    loadData();
                                                } catch (error) {
                                                    console.error('Erro ao atualizar status:', error);
                                                }
                                            }}
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${stage.status === 'finished'
                                                ? 'bg-fishing-100 text-fishing-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {stage.status === 'finished' ? '✓ Finalizada' : 'Ativa'}
                                        </button>
                                        <Button
                                            variant="outline"
                                            onClick={() => openModal(stage)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleDeleteClick(stage.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={editingStage ? 'Editar Etapa' : 'Nova Etapa'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Circuito
                            </label>
                            <select
                                value={circuitId}
                                onChange={(e) => setCircuitId(e.target.value)}
                                className="input-field"
                                required
                            >
                                <option value="">Selecione um circuito</option>
                                {circuits.map(circuit => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Nome da Etapa"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Etapa 1 - Rio Grande"
                            required
                        />
                        <Input
                            label="Data"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                        <Input
                            label="Local"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ex: Represa de Furnas - MG"
                            required
                        />
                        <Input
                            label="Valor da Inscrição (R$)"
                            type="number"
                            step="0.01"
                            value={registrationFee}
                            onChange={(e) => setRegistrationFee(parseFloat(e.target.value))}
                            required
                        />

                        {/* GPS Tracking Configuration */}
                        <div className="border-t pt-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Rastreamento GPS
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Habilite para rastrear equipes em tempo real durante a etapa
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setGpsTrackingEnabled(!gpsTrackingEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gpsTrackingEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gpsTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {gpsTrackingEnabled && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Horário Início
                                            </label>
                                            <input
                                                type="time"
                                                value={gpsStartTime}
                                                onChange={(e) => setGpsStartTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Horário Término
                                            </label>
                                            <input
                                                type="time"
                                                value={gpsEndTime}
                                                onChange={(e) => setGpsEndTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Intervalo de Atualização (segundos)
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="300"
                                            value={gpsUpdateInterval}
                                            onChange={(e) => setGpsUpdateInterval(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Recomendado: 30 segundos (mínimo 10s, máximo 300s)
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imagem da Etapa
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                <span className="font-semibold text-gray-700">Tamanho recomendado:</span> 800x600px |
                                <span className="font-semibold text-gray-700"> Formatos:</span> JPG, PNG, WebP |
                                <span className="font-semibold text-gray-700"> Máximo:</span> 3MB
                            </p>
                            <div className="flex items-center gap-4">
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                        <Upload className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm text-gray-700">Escolher Arquivo</span>
                                    </div>
                                </label>
                                {selectedFile && (
                                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                        {selectedFile.name}
                                    </span>
                                )}
                            </div>

                            {(selectedFile || imageUrl) && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preview:
                                    </label>
                                    <img
                                        src={selectedFile ? URL.createObjectURL(selectedFile) : imageUrl}
                                        alt="Preview"
                                        className="w-full h-48 object-cover rounded-lg border"
                                    />
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            loading={uploading}
                        >
                            {editingStage ? 'Salvar Alterações' : 'Criar Etapa'}
                        </Button>
                    </form>
                </Modal>

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Etapa?</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir esta etapa?
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
                                    onClick={confirmDeleteStage}
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
