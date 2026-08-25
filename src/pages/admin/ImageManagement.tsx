import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SponsorLogo, StageImage, ChampionGallery, Stage } from '@/types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Award, Star, MapPin, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

type TabId = 'sponsors' | 'stage-images' | 'champions';

export function ImageManagement() {
    const { currentUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState<TabId>('sponsors');



    // Sponsor Logos
    const [sponsorLogos, setSponsorLogos] = useState<SponsorLogo[]>([]);
    const [sponsorName, setSponsorName] = useState('');
    const [sponsorLink, setSponsorLink] = useState('');

    // Stage Images
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStageId, setSelectedStageId] = useState('');
    const [stageImages, setStageImages] = useState<StageImage[]>([]);
    const [stageImageDesc, setStageImageDesc] = useState('');

    // Champion Gallery
    const [championImages, setChampionImages] = useState<ChampionGallery[]>([]);
    const [championCaption, setChampionCaption] = useState('');
    const [championStageId, setChampionStageId] = useState('');

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: string, imageUrl: string } | null>(null);

    useEffect(() => {
        loadSponsorLogos();
        loadStages();
        loadChampionImages();
    }, []);

    useEffect(() => {
        if (selectedStageId) {
            loadStageImages(selectedStageId);
        }
    }, [selectedStageId]);

    // ============================================
    // LOAD FUNCTIONS
    // ============================================

    const loadSponsorLogos = async () => {
        let query = supabase.from('sponsor_logos').select('*');
        if (currentUser?.role === 'company' && currentUser?.id) {
            query = query.eq('company_id', currentUser.id);
        }
        const { data, error } = await query.order('display_order', { ascending: true });

        if (error) {
            console.error('Erro ao carregar patrocinadores:', error);
            return;
        }

        setSponsorLogos(data.map((item: any) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.image_url,
            linkUrl: item.link_url,
            displayOrder: item.display_order,
            active: item.active,
            createdAt: new Date(item.created_at),
            updatedAt: item.updated_at ? new Date(item.updated_at) : undefined
        })));
    };

    const loadStages = async () => {
        const { data, error } = await supabase
            .from('stages')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Erro ao carregar etapas:', error);
            return;
        }

        setStages(data.map((item: any) => ({
            id: item.id,
            circuitId: item.circuit_id,
            name: item.name,
            date: new Date(item.date),
            location: item.location,
            registrationFee: item.registration_fee,
            imageUrl: item.image_url,
            status: item.status,
            createdAt: new Date(item.created_at)
        })));
    };

    const loadStageImages = async (stageId: string) => {
        const { data, error } = await supabase
            .from('stage_images')
            .select('*')
            .eq('stage_id', stageId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Erro ao carregar imagens da etapa:', error);
            return;
        }

        setStageImages(data.map((item: any) => ({
            id: item.id,
            stageId: item.stage_id,
            imageUrl: item.image_url,
            description: item.description,
            displayOrder: item.display_order,
            createdAt: new Date(item.created_at)
        })));
    };

    const loadChampionImages = async () => {
        const { data, error } = await supabase
            .from('champion_gallery')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Erro ao carregar galeria de campeões:', error);
            return;
        }

        setChampionImages(data.map((item: any) => ({
            id: item.id,
            stageId: item.stage_id,
            teamId: item.team_id,
            imageUrl: item.image_url,
            caption: item.caption,
            displayOrder: item.display_order,
            createdAt: new Date(item.created_at)
        })));
    };

    // ============================================
    // SAVE FUNCTIONS
    // ============================================

    const handleSponsorUpload = async (url: string) => {
        if (!sponsorName.trim()) {
            alert('Digite o nome do patrocinador');
            return;
        }

        const insertData: any = {
            name: sponsorName,
            image_url: url,
            link_url: sponsorLink || null,
            display_order: sponsorLogos.length,
            active: true
        };
        if (currentUser?.role === 'company' && currentUser?.id) {
            insertData.company_id = currentUser.id;
        }

        const { error } = await supabase
            .from('sponsor_logos')
            .insert(insertData);

        if (error) {
            console.error('Erro ao salvar patrocinador:', error);
            alert('Erro ao salvar patrocinador');
            return;
        }

        setSponsorName('');
        setSponsorLink('');
        loadSponsorLogos();
    };

    const handleStageImageUpload = async (url: string) => {
        if (!selectedStageId) {
            alert('Selecione uma etapa');
            return;
        }

        const { error } = await supabase
            .from('stage_images')
            .insert({
                stage_id: selectedStageId,
                image_url: url,
                description: stageImageDesc || null,
                display_order: stageImages.length
            });

        if (error) {
            console.error('Erro ao salvar imagem da etapa:', error);
            alert('Erro ao salvar imagem');
            return;
        }

        setStageImageDesc('');
        loadStageImages(selectedStageId);
    };

    const handleChampionUpload = async (url: string) => {
        const { error } = await supabase
            .from('champion_gallery')
            .insert({
                stage_id: championStageId || null,
                image_url: url,
                caption: championCaption || null,
                display_order: championImages.length
            });

        if (error) {
            console.error('Erro ao salvar foto de campeão:', error);
            alert('Erro ao salvar foto');
            return;
        }

        setChampionCaption('');
        setChampionStageId('');
        loadChampionImages();
    };

    // ============================================
    // DELETE FUNCTIONS
    // ============================================

    const handleDeleteClick = (id: string, type: string, imageUrl: string) => {
        setItemToDelete({ id, type, imageUrl });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { id, type, imageUrl } = itemToDelete;

        const path = imageUrl.split('/').pop();

        try {
            if (type === 'sponsor') {
                if (path) await supabase.storage.from('sponsor-logos').remove([path]);
                await supabase.from('sponsor_logos').delete().eq('id', id);
                loadSponsorLogos();
            } else if (type === 'stage-image') {
                if (path) await supabase.storage.from('stage-images').remove([path]);
                await supabase.from('stage_images').delete().eq('id', id);
                if (selectedStageId) loadStageImages(selectedStageId);
            } else if (type === 'champion') {
                if (path) await supabase.storage.from('champion-gallery').remove([path]);
                await supabase.from('champion_gallery').delete().eq('id', id);
                loadChampionImages();
            }

            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            alert('Erro ao excluir item.');
        }
    };

    // ============================================
    // RENDER
    // ============================================

        const tabs = [
        { id: 'sponsors' as TabId, label: 'Patrocinadores', icon: <Award className="w-5 h-5" /> },
        { id: 'stage-images' as TabId, label: 'Imagens das Etapas', icon: <MapPin className="w-5 h-5" /> },
        { id: 'champions' as TabId, label: 'Galeria de Campeões', icon: <Star className="w-5 h-5" /> },
    ];

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Imagens</h1>
                <p className="text-gray-600 mt-2">Upload e gerenciamento de logos, patrocinadores e galerias</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab.id
                                    ? 'border-ocean-500 text-ocean-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* SPONSORS TAB */}
                {activeTab === 'sponsors' && (
                    <>
                        <Card>
                            <h2 className="text-xl font-semibold mb-4">Novo Patrocinador</h2>
                            <div className="space-y-4">
                                <Input
                                    label="Nome do Patrocinador"
                                    value={sponsorName}
                                    onChange={(e) => setSponsorName(e.target.value)}
                                    placeholder="Ex: Empresa XYZ"
                                />
                                <Input
                                    label="Link (opcional)"
                                    value={sponsorLink}
                                    onChange={(e) => setSponsorLink(e.target.value)}
                                    placeholder="https://..."
                                />
                                <ImageUploader
                                    bucket="sponsor-logos"
                                    onUploadComplete={handleSponsorUpload}
                                    recommendedSize={{ width: 200, height: 200 }}
                                    maxSizeMB={2}
                                    label="Logo do Patrocinador"
                                />
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-xl font-semibold mb-4">Patrocinadores Cadastrados</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {sponsorLogos.map(sponsor => (
                                    <div key={sponsor.id} className="border rounded-lg p-3 space-y-2">
                                        <img src={sponsor.imageUrl} alt={sponsor.name} className="w-full h-20 object-contain" />
                                        <p className="text-sm font-medium truncate">{sponsor.name}</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDeleteClick(sponsor.id, 'sponsor', sponsor.imageUrl)}
                                            className="w-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                )}

                {/* STAGE IMAGES TAB */}
                {activeTab === 'stage-images' && (
                    <>
                        <Card>
                            <h2 className="text-xl font-semibold mb-4">Nova Imagem de Etapa</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Selecione a Etapa
                                    </label>
                                    <select
                                        value={selectedStageId}
                                        onChange={(e) => setSelectedStageId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500"
                                    >
                                        <option value="">-- Selecione --</option>
                                        {stages.map(stage => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name} - {stage.date.toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Descrição (opcional)"
                                    value={stageImageDesc}
                                    onChange={(e) => setStageImageDesc(e.target.value)}
                                    placeholder="Descrição da imagem"
                                />
                                <ImageUploader
                                    bucket="stage-images"
                                    onUploadComplete={handleStageImageUpload}
                                    recommendedSize={{ width: 800, height: 800 }}
                                    label="Imagem 800x800px"
                                />
                            </div>
                        </Card>

                        {selectedStageId && (
                            <Card>
                                <h2 className="text-xl font-semibold mb-4">Imagens desta Etapa</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {stageImages.map(img => (
                                        <div key={img.id} className="border rounded-lg p-3 space-y-2">
                                            <img src={img.imageUrl} alt={img.description || ''} className="w-full h-32 object-cover rounded" />
                                            {img.description && (
                                                <p className="text-sm text-gray-600 truncate">{img.description}</p>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeleteClick(img.id, 'stage-image', img.imageUrl)}
                                                className="w-full"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </>
                )}

                {/* CHAMPIONS TAB */}
                {activeTab === 'champions' && (
                    <>
                        <Card>
                            <h2 className="text-xl font-semibold mb-4">Nova Foto de Campeão</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Etapa (opcional)
                                    </label>
                                    <select
                                        value={championStageId}
                                        onChange={(e) => setChampionStageId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500"
                                    >
                                        <option value="">-- Nenhuma --</option>
                                        {stages.map(stage => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Legenda (opcional)"
                                    value={championCaption}
                                    onChange={(e) => setChampionCaption(e.target.value)}
                                    placeholder="Ex: Campeão Etapa 1 - 2025"
                                />
                                <ImageUploader
                                    bucket="champion-gallery"
                                    onUploadComplete={handleChampionUpload}
                                    recommendedSize={{ width: 800, height: 600 }}
                                    maxSizeMB={8}
                                    label="Foto do Campeão"
                                />
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-xl font-semibold mb-4">Galeria de Campeões</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {championImages.map(img => (
                                    <div key={img.id} className="border rounded-lg p-3 space-y-2">
                                        <img src={img.imageUrl} alt={img.caption || ''} className="w-full h-40 object-cover rounded" />
                                        {img.caption && (
                                            <p className="text-sm text-gray-600 truncate">{img.caption}</p>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDeleteClick(img.id, 'champion', img.imageUrl)}
                                            className="w-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </>
                )}

                {/* Delete Modal */}
                {deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Item?</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir este item?
                                <br />Essa ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
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
