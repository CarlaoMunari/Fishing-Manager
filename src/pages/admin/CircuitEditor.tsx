import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, Save, Upload, Bold, Italic, List } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { User } from '@/types';

export function CircuitEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { companyId: contextCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companies, setCompanies] = useState<User[]>([]);

    // Form State
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [name, setName] = useState('');
    const [year, setYear] = useState(new Date().getFullYear());
    const [active, setActive] = useState(true);
    const [regulation, setRegulation] = useState('');
    const [modalityBoat, setModalityBoat] = useState(true);
    const [modalityKayak, setModalityKayak] = useState(false);
    const [fishCount, setFishCount] = useState(6); // Default 6
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        if (currentUser?.role === 'super_admin') {
            loadCompanies();
        }
        if (id) {
            loadCircuit(id);
        } else {
            setLoading(false);
        }
    }, [id, currentUser]);

    const loadCompanies = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'company')
            .order('name');

        if (data) {
            setCompanies(data as User[]);
        }
    };

    const loadCircuit = async (circuitId: string) => {
        try {
            const { data, error } = await supabase
                .from('circuits')
                .select('*')
                .eq('id', circuitId)
                .single();

            if (error) throw error;

            if (data) {
                setName(data.name);
                setYear(data.year);
                setActive(data.active);
                setRegulation(data.regulation || '');
                setModalityBoat(data.modality_boat ?? true); // Default to true if undefined
                setModalityKayak(data.modality_kayak ?? false);
                setFishCount(data.fish_count || 6);
                setSelectedCompanyId(data.company_id || '');
            }
        } catch (error) {
            console.error('Erro ao carregar circuito:', error);
            alert('Erro ao carregar circuito');
            navigate('/admin/circuits');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const circuitData = {
                name,
                year,
                active,
                regulation,
                modality_boat: modalityBoat,
                modality_kayak: modalityKayak,
                fish_count: fishCount,
                company_id: selectedCompanyId || contextCompanyId || currentUser?.id
            };

            let circuitId = id;

            if (id) {
                const { error } = await supabase
                    .from('circuits')
                    .update(circuitData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('circuits')
                    .insert(circuitData)
                    .select()
                    .single();
                if (error) throw error;
                circuitId = data.id;
            }

            // Handle Image Upload if exists
            if (imageFile && circuitId) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${circuitId}-logo.${fileExt}`;
                const filePath = `circuit-logos/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, imageFile, { upsert: true });

                if (uploadError) throw uploadError;
            }

            navigate('/admin/circuits');
        } catch (error) {
            console.error('Erro ao salvar circuito:', error);
            alert('Erro ao salvar circuito');
        } finally {
            setSaving(false);
        }
    };

    const insertTag = (tag: string) => {
        const textarea = document.getElementById('regulation-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const selection = text.substring(start, end);

        let newText = '';
        if (tag === 'b') newText = `${before}<b>${selection}</b>${after}`;
        if (tag === 'i') newText = `${before}<i>${selection}</i>${after}`;
        if (tag === 'ul') newText = `${before}<ul>\n<li>${selection}</li>\n</ul>${after}`;
        if (tag === 'h3') newText = `${before}<h3>${selection}</h3>${after}`;

        setRegulation(newText);
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
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate('/admin/circuits')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {id ? 'Editar Campeonato' : 'Novo Campeonato'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cadastro ou edição dos Campeonatos
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-6">
                    {/* Super Admin: Select Company */}
                    {currentUser?.role === 'super_admin' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Proprietária</label>
                            <select
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Minha conta (Super Admin)</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.id}>
                                        {company.name} ({company.slug})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Selecione a empresa que será dona deste campeonato. Se deixar em branco, ficará vinculado à sua conta.
                            </p>
                        </div>
                    )}

                    {/* Row 1: Status & Title */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={active ? 'true' : 'false'}
                                onChange={(e) => setActive(e.target.value === 'true')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: 4º CIRCUITO STA FISHING 2025"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Year & Modalities */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                            <Input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade Embarcada</label>
                            <select
                                value={modalityBoat ? 'true' : 'false'}
                                onChange={(e) => setModalityBoat(e.target.value === 'true')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade Caiaque</label>
                            <select
                                value={modalityKayak ? 'true' : 'false'}
                                onChange={(e) => setModalityKayak(e.target.value === 'true')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Fish Count */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantidade de Peixes Válidos
                            </label>
                            <select
                                value={fishCount}
                                onChange={(e) => setFishCount(Number(e.target.value))}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={1}>1 Peixe</option>
                                <option value={2}>2 Peixes</option>
                                <option value={3}>3 Peixes</option>
                                <option value={4}>4 Peixes</option>
                                <option value={5}>5 Peixes</option>
                                <option value={6}>6 Peixes</option>
                                <option value={7}>7 Peixes</option>
                                <option value={8}>8 Peixes</option>
                                <option value={9}>9 Peixes</option>
                                <option value={10}>10 Peixes</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Define quantos peixes contam para a pontuação e quantos campos aparecem na ficha.
                            </p>
                        </div>
                    </div>

                    {/* Row 4: Regulation */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Regulamento</label>
                        <div className="border border-gray-300 rounded-md overflow-hidden">
                            {/* Toolbar */}
                            <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2">
                                <button type="button" onClick={() => insertTag('b')} className="p-1 hover:bg-gray-200 rounded" title="Negrito">
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => insertTag('i')} className="p-1 hover:bg-gray-200 rounded" title="Itálico">
                                    <Italic className="w-4 h-4" />
                                </button>
                                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                <button type="button" onClick={() => insertTag('ul')} className="p-1 hover:bg-gray-200 rounded" title="Lista">
                                    <List className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => insertTag('h3')} className="p-1 hover:bg-gray-200 rounded" title="Título">
                                    <span className="font-bold text-xs">H3</span>
                                </button>
                            </div>
                            <textarea
                                id="regulation-editor"
                                value={regulation}
                                onChange={(e) => setRegulation(e.target.value)}
                                className="w-full px-4 py-3 min-h-[400px] focus:outline-none resize-y"
                                placeholder="Digite o regulamento aqui..."
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">HTML é suportado para formatação avançada.</p>
                    </div>

                    {/* Row 5: Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Circuito</label>
                        <p className="text-xs text-gray-500 mb-3">
                            <span className="font-semibold text-gray-700">Tamanho recomendado:</span> 600x600px |
                            <span className="font-semibold text-gray-700"> Formatos:</span> JPG, PNG |
                            <span className="font-semibold text-gray-700"> Máximo:</span> 2MB
                        </p>
                        <div className="flex items-center gap-4">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                    <Upload className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">Escolher arquivo</span>
                                </div>
                            </label>
                            <span className="text-sm text-gray-500">
                                {imageFile ? imageFile.name : 'Nenhum arquivo escolhido'}
                            </span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate('/admin/circuits')}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" loading={saving}>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
