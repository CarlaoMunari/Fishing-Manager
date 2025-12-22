import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CarouselImage } from '@/types';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Upload } from 'lucide-react';

export function CarouselManagement() {
    const { companyId } = useCompany();
    const { currentUser } = useAuth();
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]); // Using any for simplicity, or User type

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<{ id: string, url: string } | null>(null);

    // Form state
    const [altText, setAltText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    useEffect(() => {
        loadImages();
        if (currentUser?.role === 'super_admin') {
            loadCompanies();
        }
    }, [currentUser]);

    const loadCompanies = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('role', 'company')
            .order('name');
        if (data) setCompanies(data);
    };

    const loadImages = async () => {
        try {
            let query = supabase
                .from('carousel_images')
                .select('*');

            // Se não for super_admin, filtrar por company_id
            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query.order('order', { ascending: true });

            if (error) throw error;

            const loadedImages = data.map((item: any) => ({
                ...item,
                createdAt: new Date(item.created_at),
            })) as CarouselImage[];
            setImages(loadedImages);
        } catch (error) {
            console.error('Erro ao carregar imagens:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAddImage = async () => {
        if (!selectedFile || !altText) return;

        setSaving(true);
        try {
            // Upload to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `carousel/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // Add to Database
            const { error: dbError } = await supabase
                .from('carousel_images')
                .insert({
                    url: publicUrl,
                    alt: altText,
                    link_url: linkUrl || null,
                    order: images.length,
                    company_id: selectedCompanyId || companyId || currentUser?.id,
                });

            if (dbError) throw dbError;

            setModalOpen(false);
            setSelectedFile(null);
            setPreviewUrl('');
            setPreviewUrl('');
            setAltText('');
            setLinkUrl('');
            setSelectedCompanyId('');
            loadImages();
        } catch (error) {
            console.error('Erro ao adicionar imagem:', error);
            alert('Erro ao adicionar imagem');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: string, url: string) => {
        setImageToDelete({ id, url });
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteImage = async () => {
        if (!imageToDelete) return;

        try {
            // Delete from Database
            const { error: dbError } = await supabase
                .from('carousel_images')
                .delete()
                .eq('id', imageToDelete.id);

            if (dbError) throw dbError;

            // Try to delete from Storage (optional, if we want to clean up)
            const path = imageToDelete.url.includes('/storage/v1/object/public/images/') ? imageToDelete.url.split('/storage/v1/object/public/images/')[1] : null;
            if (path) {
                await supabase.storage.from('images').remove([path]);
            }

            loadImages();
            setIsDeleteModalOpen(false);
            setImageToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir imagem:', error);
            alert('Erro ao excluir imagem');
        }
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
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciar Carrossel</h1>
                    <Button variant="primary" onClick={() => setModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Adicionar Imagem
                    </Button>
                </div>

                {images.length === 0 ? (
                    <Card>
                        <p className="text-center text-gray-600">
                            Nenhuma imagem cadastrada. Adicione a primeira imagem!
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {images.map((image) => (
                            <Card key={image.id}>
                                <img
                                    src={image.url}
                                    alt={image.alt}
                                    className="w-full h-48 object-cover rounded-lg mb-4"
                                />
                                <p className="text-sm text-gray-600 mb-2 font-semibold">{image.alt}</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDeleteClick(image.id, image.url)}
                                        className="flex-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Excluir
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Modal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Adicionar Imagem ao Carrossel"
                >
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="carousel-image-upload"
                            />
                            <label
                                htmlFor="carousel-image-upload"
                                className="cursor-pointer flex flex-col items-center gap-2"
                            >
                                <Upload className="w-8 h-8 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                    Clique para selecionar uma imagem
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                    Tamanho ideal: Qualquer largura x 600px altura (ex: 1600x600, 1920x600, 2560x600)
                                </span>
                                <span className="text-xs text-gray-400">
                                    Máximo: 5MB | Formatos: JPG, PNG, WebP | Largura mínima recomendada: 1600px
                                </span>
                            </label>
                        </div>

                        {previewUrl && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preview:
                                </label>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg border"
                                />
                            </div>
                        )}



                        {currentUser?.role === 'super_admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
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
                            </div>
                        )}

                        <Input
                            label="Texto Alternativo (Alt)"
                            value={altText}
                            onChange={(e) => setAltText(e.target.value)}
                            placeholder="Descrição da imagem"
                            required
                        />

                        <Input
                            label="Link (URL) - Opcional"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://exemplo.com (deixe vazio se não quiser link)"
                        />

                        <Button
                            variant="primary"
                            onClick={handleAddImage}
                            loading={saving}
                            disabled={!selectedFile || !altText}
                            className="w-full"
                        >
                            Fazer Upload e Salvar
                        </Button>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
                            <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Imagem?</h3>
                            <p className="text-gray-600 mb-6">
                                Tem certeza que deseja excluir esta imagem?
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
                                    onClick={confirmDeleteImage}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </AdminLayout >
    );
}
