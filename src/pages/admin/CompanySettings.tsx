import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Save, Layout, Image as ImageIcon, Phone, Mail, MapPin, Instagram, Facebook, Youtube } from 'lucide-react';
import { ImageUploader } from '@/components/admin/ImageUploader';


export function CompanySettings() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    // Configurações Básicas
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563eb');
    const [logoUrl, setLogoUrl] = useState('');

    // Dados de Contato
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactAddress, setContactAddress] = useState('');

    // Redes Sociais
    const [socialInstagram, setSocialInstagram] = useState('');
    const [socialFacebook, setSocialFacebook] = useState('');
    const [socialYoutube, setSocialYoutube] = useState('');

    // Configurações de Pagamento - PIX
    const [pixKey, setPixKey] = useState('');
    const [pixKeyType, setPixKeyType] = useState('cpf');
    const [pixBeneficiaryName, setPixBeneficiaryName] = useState('');
    const [paymentInstructions, setPaymentInstructions] = useState('');

    // Mercado Pago
    const [mpEnabled, setMpEnabled] = useState(false);
    const [mpAccessToken, setMpAccessToken] = useState('');
    const [mpPublicKey, setMpPublicKey] = useState('');


    useEffect(() => {
        loadSettings();
    }, [currentUser]);

    const loadSettings = async () => {
        if (currentUser) {
            try {
                const { data, error } = await supabase
                    .from('company_settings')
                    .select('*')
                    .eq('company_id', currentUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Erro ao carregar configurações:', error);
                    return;
                }

                if (data) {
                    setTitle(data.title || '');
                    setSubtitle(data.subtitle || '');
                    setPrimaryColor(data.primary_color || '#2563eb');
                    setLogoUrl(data.logo_url || '');
                    setContactEmail(data.contact_email || '');
                    setContactPhone(data.contact_phone || '');
                    setContactAddress(data.contact_address || '');
                    setSocialInstagram(data.social_instagram || '');
                    setSocialFacebook(data.social_facebook || '');
                    setSocialYoutube(data.social_youtube || '');
                    // Pagamento
                    setPixKey(data.pix_key || '');
                    setPixKeyType(data.pix_key_type || 'cpf');
                    setPixBeneficiaryName(data.pix_beneficiary_name || '');
                    setPaymentInstructions(data.payment_instructions || '');
                    setMpEnabled(data.mp_enabled || false);
                    setMpAccessToken(data.mp_access_token || '');
                    setMpPublicKey(data.mp_public_key || '');
                }
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (currentUser) {
                const settings = {
                    company_id: currentUser.id,
                    title,
                    subtitle,
                    primary_color: primaryColor,
                    logo_url: logoUrl,
                    contact_email: contactEmail,
                    contact_phone: contactPhone,
                    contact_address: contactAddress,
                    social_instagram: socialInstagram,
                    social_facebook: socialFacebook,
                    social_youtube: socialYoutube,
                    // Pagamento
                    pix_key: pixKey,
                    pix_key_type: pixKeyType,
                    pix_beneficiary_name: pixBeneficiaryName,
                    payment_instructions: paymentInstructions,
                    mp_enabled: mpEnabled,
                    mp_access_token: mpAccessToken,
                    mp_public_key: mpPublicKey,
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('company_settings')
                    .upsert(settings, {
                        onConflict: 'company_id'
                    });

                if (error) throw error;

                alert('Configurações salvas com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configuração da Página Inicial</h1>
                        <p className="text-gray-500">Personalize a aparência e dados de contato da sua página</p>
                    </div>
                    <Button onClick={handleSave} loading={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Informações Básicas */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Layout className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold">Informações Básicas</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Página</label>
                                <Input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ex: Circuito Pesca Show"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                                <Input
                                    value={subtitle}
                                    onChange={e => setSubtitle(e.target.value)}
                                    placeholder="Ex: O maior campeonato da região"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={e => setPrimaryColor(e.target.value)}
                                        className="h-10 w-20 rounded cursor-pointer border border-gray-300"
                                    />
                                    <span className="text-sm text-gray-500">{primaryColor}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Salvo para uso futuro (em desenvolvimento)</p>
                            </div>
                        </div>
                    </Card>

                    {/* Dados de Contato */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Phone className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold">Dados de Contato</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email de Contato
                                </label>
                                <Input
                                    type="email"
                                    value={contactEmail}
                                    onChange={e => setContactEmail(e.target.value)}
                                    placeholder="contato@circuito.com.br"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Telefone de Contato
                                </label>
                                <Input
                                    value={contactPhone}
                                    onChange={e => setContactPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    Endereço
                                </label>
                                <Input
                                    value={contactAddress}
                                    onChange={e => setContactAddress(e.target.value)}
                                    placeholder="Av. Principal, 1000 - São Paulo - SP"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Redes Sociais */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Instagram className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold">Redes Sociais</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Instagram className="w-4 h-4 inline mr-1 text-pink-600" />
                                    Instagram
                                </label>
                                <Input
                                    value={socialInstagram}
                                    onChange={e => setSocialInstagram(e.target.value)}
                                    placeholder="https://instagram.com/seuperfil"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Facebook className="w-4 h-4 inline mr-1 text-blue-600" />
                                    Facebook
                                </label>
                                <Input
                                    value={socialFacebook}
                                    onChange={e => setSocialFacebook(e.target.value)}
                                    placeholder="https://facebook.com/suapagina"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Youtube className="w-4 h-4 inline mr-1 text-red-600" />
                                    YouTube
                                </label>
                                <Input
                                    value={socialYoutube}
                                    onChange={e => setSocialYoutube(e.target.value)}
                                    placeholder="https://youtube.com/@seucanal"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Cole os links completos das suas redes sociais. Deixe em branco as que não quiser exibir.
                            </p>
                        </div>
                    </Card>

                    {/* Configurações de Pagamento */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                            </svg>
                            <h2 className="text-xl font-bold text-gray-900">Configurações de Pagamento</h2>
                        </div>

                        {/* PIX (Obrigatório) */}
                        <div className="space-y-4 mb-6 pb-6 border-b">
                            <h3 className="font-semibold text-gray-900">PIX (Obrigatório)</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo de Chave PIX
                                    </label>
                                    <select
                                        value={pixKeyType}
                                        onChange={e => setPixKeyType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="cpf">CPF</option>
                                        <option value="cnpj">CNPJ</option>
                                        <option value="email">E-mail</option>
                                        <option value="phone">Telefone</option>
                                        <option value="random">Chave Aleatória</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chave PIX
                                    </label>
                                    <Input
                                        value={pixKey}
                                        onChange={e => setPixKey(e.target.value)}
                                        placeholder="Ex: 12345678900 ou email@exemplo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Beneficiário
                                </label>
                                <Input
                                    value={pixBeneficiaryName}
                                    onChange={e => setPixBeneficiaryName(e.target.value)}
                                    placeholder="Nome que aparece no PIX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Instruções de Pagamento (Opcional)
                                </label>
                                <textarea
                                    value={paymentInstructions}
                                    onChange={e => setPaymentInstructions(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Ex: Envie o comprovante para whatsapp (11) 99999-9999"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Essas informações serão exibidas na tela de pagamento das equipes.
                            </p>
                        </div>

                        {/* Mercado Pago (Opcional) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Mercado Pago (Opcional)</h3>
                                    <p className="text-sm text-gray-600">
                                        Habilite para aceitar PIX automático e Cartão de Crédito
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={mpEnabled}
                                        onChange={e => setMpEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {mpEnabled && (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 mb-2">
                                            <strong>Como obter suas credenciais:</strong>
                                        </p>
                                        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                                            <li>Acesse <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer" className="underline">Mercado Pago Developers</a></li>
                                            <li>Vá em "Suas integrações" → "Credenciais"</li>
                                            <li>Copie o Access Token e Public Key (Produção)</li>
                                        </ol>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Access Token
                                        </label>
                                        <Input
                                            type="password"
                                            value={mpAccessToken}
                                            onChange={e => setMpAccessToken(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Public Key
                                        </label>
                                        <Input
                                            type="password"
                                            value={mpPublicKey}
                                            onChange={e => setMpPublicKey(e.target.value)}
                                            placeholder="APP_USR-..."
                                        />
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-xs text-yellow-800">
                                            ⚠️ <strong>Importante:</strong> Mantenha suas credenciais em segurança.
                                            O Mercado Pago cobra taxas: PIX 0,99% / Cartão 4,99% + R$0,40
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Logo */}
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold">Logo da Empresa</h2>
                        </div>
                        <div>
                            <ImageUploader
                                bucket="company-logos"
                                onUploadComplete={(url) => setLogoUrl(url)}
                                maxSizeMB={2}
                                allowedTypes={['image/png', 'image/jpeg', 'image/svg+xml']}
                                recommendedSize={{ width: 200, height: 200 }}
                                label="Selecionar Logo"
                            />
                            <p className="text-xs text-gray-500 mt-2">Recomendado: PNG transparente, 200x200px (máx. 2MB)</p>
                            {logoUrl && (
                                <div className="mt-4 p-4 bg-gray-50 border rounded">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Logo atual:</p>
                                    <img src={logoUrl} alt="Logo da empresa" className="h-24 w-24 object-contain" />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
