import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Stage } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/public/Navbar';
import { Copy, Check, Upload, AlertCircle, CheckCircle2, DollarSign, MapPin } from 'lucide-react';

interface PaymentSettings {
    pixKey: string;
    pixKeyType: string;
    pixBeneficiaryName: string;
    paymentInstructions: string;
    mpEnabled: boolean;
}

export function Checkout() {
    const { companyName } = useParams();
    const location = useLocation();
    const navigate = useNavigate(); // Hook must be called unconditionally

    // Verificar se o state foi passado corretamente
    // Se não, pode ser acesso direto via URL ou refresh
    const state = location.state as { team: any; stage: Stage } | null;

    useEffect(() => {
        if (!state?.team || !state?.stage) {
            console.error('Dados de checkout perdidos ou acesso direto invalido');
            // Redirecionar para home ou exibir mensagem
            // navigate('/'); // Opcional: redirecionar automaticamente
        }
    }, [state, navigate]);

    if (!state?.team || !state?.stage) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Sessão Expirada ou Acesso Inválido</h2>
                    <p className="text-gray-600 mb-6">
                        Não foi possível recuperar os dados da inscrição. Por favor, inicie o processo novamente.
                    </p>
                    <Button onClick={() => navigate(companyName ? `/${companyName}` : '/')} className="w-full">
                        Voltar para o Início
                    </Button>
                </Card>
            </div>
        );
    }

    const { team, stage } = state;

    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [paymentCreated, setPaymentCreated] = useState(false);
    const [gpsAccessKey, setGpsAccessKey] = useState<string | null>(null);
    const [alreadyPaid, setAlreadyPaid] = useState(false);
    const [companySlug, setCompanySlug] = useState<string | null>(null);

    useEffect(() => {
        loadPaymentSettings();
    }, []);

    const loadPaymentSettings = async () => {
        try {
            // Suportar tanto camelCase quanto snake_case (da API do Supabase)
            let targetCompanyId = stage.companyId || (stage as any).company_id;

            // Se não tem ID no stage, tenta buscar pelo slug, mas PROTEGE contra slugs inválidos
            if (!targetCompanyId && companyName && companyName !== 'checkout') {
                const { data: company, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('slug', companyName)
                    .eq('role', 'company')
                    .single();

                if (error) {
                    console.error('Erro ao buscar empresa por slug:', error);
                }

                if (company) targetCompanyId = company.id;
            }

            if (!targetCompanyId) {
                console.warn('ID da empresa não encontrado. (Pode ser intencional se for teste local)');
                setLoading(false);
                return;
            }

            // Buscar o slug da empresa para navegação
            const { data: companyData } = await supabase
                .from('users')
                .select('slug')
                .eq('id', targetCompanyId)
                .single();

            if (companyData) {
                setCompanySlug(companyData.slug);
            }

            // Verificar se já existe pagamento aprovado
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('status')
                .eq('team_id', team.id)
                .eq('stage_id', stage.id)
                .single();

            if (existingPayment && existingPayment.status === 'paid') {
                // Buscar chave GPS da equipe
                const { data: gpsKeyData } = await supabase
                    .from('gps_access_keys')
                    .select('access_key')
                    .eq('team_id', team.id)
                    .eq('stage_id', stage.id)
                    .single();

                if (gpsKeyData) {
                    setGpsAccessKey(gpsKeyData.access_key);
                }

                setAlreadyPaid(true);
                setLoading(false);
                return;
            }

            // VERIFICAR SE EQUIPE TEM INSCRIÇÃO ISENTA
            const { data: teamData } = await supabase
                .from('teams')
                .select('exempt_registration')
                .eq('id', team.id)
                .single();

            // Se equipe é isenta, criar pagamento aprovado automaticamente
            if (teamData?.exempt_registration) {
                // Verificar se já existe algum registro de pagamento
                const { data: existingAnyPayment } = await supabase
                    .from('payments')
                    .select('id')
                    .eq('team_id', team.id)
                    .eq('stage_id', stage.id)
                    .single();

                // Se não existe, criar pagamento isento
                if (!existingAnyPayment) {
                    const { error: exemptPaymentError } = await supabase
                        .from('payments')
                        .insert({
                            team_id: team.id,
                            stage_id: stage.id,
                            company_id: targetCompanyId,
                            amount: 0,
                            payment_method: 'direct',
                            status: 'paid',
                            paid_at: new Date().toISOString()
                        });

                    if (exemptPaymentError) {
                        console.error('Erro ao criar pagamento isento:', exemptPaymentError);
                    } else {
                        // Marcar equipe como paga
                        await supabase
                            .from('teams')
                            .update({ paid: true })
                            .eq('id', team.id);
                    }
                }

                // Redirecionar para tela de confirmação
                setAlreadyPaid(true);
                setLoading(false);
                return;
            }

            // Buscar configurações de pagamento
            const { data: companySettings } = await supabase
                .from('company_settings')
                .select('pix_key, pix_key_type, pix_beneficiary_name, payment_instructions, mp_enabled')
                .eq('company_id', targetCompanyId)
                .single();

            if (companySettings) {
                setSettings({
                    pixKey: companySettings.pix_key || '',
                    pixKeyType: companySettings.pix_key_type || '',
                    pixBeneficiaryName: companySettings.pix_beneficiary_name || '',
                    paymentInstructions: companySettings.payment_instructions || '',
                    mpEnabled: companySettings.mp_enabled || false
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyPixKey = () => {
        if (settings?.pixKey) {
            navigator.clipboard.writeText(settings.pixKey);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                alert('Por favor, envie apenas imagens ou PDF');
                return;
            }
            // Validar tamanho (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Arquivo muito grande. Máximo 5MB');
                return;
            }
            setProofFile(file);
        }
    };

    const handleSubmitPayment = async () => {
        if (!proofFile) {
            alert('Por favor, envie o comprovante de pagamento');
            return;
        }

        setUploading(true);
        try {
            // Suportar tanto camelCase quanto snake_case (da API do Supabase)
            let targetCompanyId = stage.companyId || (stage as any).company_id;

            if (!targetCompanyId && companyName) {
                const { data: company } = await supabase
                    .from('users')
                    .select('id')
                    .eq('slug', companyName)
                    .eq('role', 'company')
                    .single();

                if (company) targetCompanyId = company.id;
            }

            if (!targetCompanyId) {
                throw new Error('Empresa não encontrada');
            }

            // Upload do comprovante para Supabase Storage
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${team.id}-${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, proofFile);

            if (uploadError) throw uploadError;

            // Obter URL pública do arquivo
            const { data: urlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // Criar registro de pagamento
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    team_id: team.id,
                    stage_id: stage.id,
                    company_id: targetCompanyId,
                    amount: stage.registrationFee,
                    payment_method: 'pix_manual',
                    proof_url: urlData.publicUrl,
                    proof_uploaded_at: new Date().toISOString(),
                    status: 'pending'
                });

            if (paymentError) throw paymentError;

            // Gerar chave de acesso GPS para a equipe
            const { createGPSAccessKey } = await import('@/lib/gps');
            const { data: gpsKey, error: gpsError } = await createGPSAccessKey(team.id, stage.id);

            if (gpsError) {
                console.error('Erro ao gerar chave GPS:', gpsError);
            } else if (gpsKey) {
                setGpsAccessKey(gpsKey.access_key);
            }

            setPaymentCreated(true);
        } catch (error) {
            console.error('Erro ao enviar comprovante:', error);
            alert('Erro ao enviar comprovante. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
                <Navbar />
                <div className="container mx-auto px-4 py-16 flex justify-center">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    // Tela de confirmação para equipes já pagas
    if (alreadyPaid) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <Card className="max-w-2xl mx-auto p-12 text-center">
                        <div className="bg-green-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                            <CheckCircle2 className="w-16 h-16 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">
                            Equipe Confirmada no Evento!
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            O pagamento da equipe <strong>{team.teamName || team.team_name}</strong> foi aprovado.
                        </p>
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
                            <p className="text-sm text-green-800 mb-2">
                                ✓ <strong>Pagamento Confirmado</strong>
                            </p>
                            <p className="text-sm text-green-700">
                                Sua equipe está oficialmente inscrita na etapa: <strong>{stage.name}</strong>
                            </p>
                        </div>

                        {/* GPS Access Key Section */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-gray-900">Rastreamento GPS</h3>
                            </div>
                            <p className="text-sm text-gray-700 mb-4">
                                Use esta chave para ativar o rastreamento GPS da sua embarcação:
                            </p>
                            {gpsAccessKey ? (
                                <>
                                    <div className="bg-white border-2 border-green-400 rounded-lg p-4 mb-3 font-mono text-center text-xl font-bold text-green-700 tracking-wider">
                                        {gpsAccessKey}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(gpsAccessKey);
                                            alert('Código GPS copiado!');
                                        }}
                                        className="w-full mb-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copiar Código GPS
                                    </button>
                                </>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-3 text-center">
                                    <p className="text-yellow-800">
                                        Código GPS será gerado após confirmação do pagamento
                                    </p>
                                </div>
                            )}
                            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                                <p className="mb-2"><strong>Como usar:</strong></p>
                                <p> 1. Acesse <strong className="text-blue-600">{window.location.origin}/gps</strong> no celular</p>
                                <p>📱 2. Insira a chave de acesso</p>
                                <p>📡 3. Ative o rastreamento durante o evento</p>
                            </div>
                        </div>

                        <Button
                            onClick={() => navigate(companySlug ? `/${companySlug}` : '/')}
                            className="w-full"
                        >
                            Voltar para Página Inicial
                        </Button>
                    </Card>
                </div >
            </div >
        );
    }

    if (paymentCreated) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
                <Navbar />
                <div className="container mx-auto px-4 py-16">
                    <Card className="max-w-2xl mx-auto p-8 text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Solicitação Enviada!
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Seu pagamento está em análise. Você receberá uma confirmação em breve.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <strong>Status:</strong> Aguardando Aprovação
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Assim que o pagamento for aprovado, sua inscrição será confirmada.
                            </p>
                        </div>

                        {/* Chave de Acesso GPS */}
                        {gpsAccessKey && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Chave de Acesso GPS
                                </h3>
                                <p className="text-sm text-green-700 mb-3">
                                    Use esta chave para ativar o rastreamento GPS durante o evento:
                                </p>
                                <div className="bg-white border border-green-300 rounded-lg p-4 mb-3">
                                    <code className="text-lg font-mono font-bold text-green-900 block text-center">
                                        {gpsAccessKey}
                                    </code>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                                    <p className="mb-2 font-semibold">📱 Como usar:</p>
                                    <p className="mb-1">1. Acesse <strong className="text-blue-600">{window.location.origin}/gps</strong> no celular</p>
                                    <p className="mb-1">2. Insira a chave acima</p>
                                    <p>3. Ative o rastreamento durante o evento</p>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(gpsAccessKey);
                                        alert('Chave copiada!');
                                    }}
                                    className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copiar Chave GPS
                                </button>
                                <p className="text-xs text-green-600 mt-2">
                                    💡 Guarde esta chave com segurança. Você precisará dela para o rastreamento GPS.
                                </p>
                            </div>
                        )
                        }

                        <Button onClick={() => navigate(companySlug ? `/${companySlug}` : '/')}>
                            Voltar para Início
                        </Button>
                    </Card >
                </div >
            </div >
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">Pagamento da Inscrição</h1>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Resumo da Inscrição */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                Resumo
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Equipe</p>
                                    <p className="font-semibold text-gray-900">{team.team_name || team.teamName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Etapa</p>
                                    <p className="font-semibold text-gray-900">{stage.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Local</p>
                                    <p className="text-gray-900">{stage.location}</p>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">Valor da Inscrição</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        R$ {(stage.registrationFee || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Dados PIX */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Pagamento via PIX</h2>

                            {!settings?.pixKey ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 inline mr-2" />
                                    <span className="text-yellow-800">
                                        Chave PIX não configurada pela empresa
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Tipo de Chave</p>
                                        <p className="font-semibold uppercase">{settings.pixKeyType}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Chave PIX</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={settings.pixKey}
                                                readOnly
                                                className="flex-1 px-3 py-2 bg-gray-50 border rounded-md font-mono text-sm"
                                            />
                                            <button
                                                onClick={copyPixKey}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                {copiedKey ? 'Copiado!' : 'Copiar'}
                                            </button>
                                        </div>
                                    </div>
                                    {settings.pixBeneficiaryName && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Beneficiário</p>
                                            <p className="font-semibold">{settings.pixBeneficiaryName}</p>
                                        </div>
                                    )}
                                    {settings.paymentInstructions && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm text-blue-800 whitespace-pre-line">
                                                {settings.paymentInstructions}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Upload de Comprovante ou Pagamento Direto */}
                    <Card className="p-6 mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-blue-600" />
                            Confirmar Pagamento
                        </h2>

                        <div className="space-y-6">
                            {/* Opção 1: PIX com Comprovante */}
                            {settings?.pixKey && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-900">Opção 1: Pagamento via PIX</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Enviar comprovante de pagamento
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Aceita imagens (JPG, PNG) ou PDF. Máximo 5MB.
                                        </p>
                                    </div>

                                    {proofFile && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <p className="text-sm text-green-800">
                                                ✓ Arquivo selecionado: <strong>{proofFile.name}</strong>
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSubmitPayment}
                                        disabled={!proofFile || uploading}
                                        loading={uploading}
                                        className="w-full"
                                    >
                                        {uploading ? 'Enviando...' : 'Confirmar Pagamento com Comprovante'}
                                    </Button>
                                </div>
                            )}

                            {/* Divisor */}
                            {settings?.pixKey && (
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-500">OU</span>
                                    </div>
                                </div>
                            )}

                            {/* Opção 2: Pagamento Direto */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">
                                    {settings?.pixKey ? 'Opção 2: ' : ''}Pagamento Direto com Organizador
                                </h3>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800">
                                        Escolha esta opção se você vai pagar diretamente ao organizador do evento.
                                        Sua inscrição ficará pendente até o organizador confirmar o recebimento do pagamento.
                                    </p>
                                </div>
                                <Button
                                    onClick={async () => {
                                        // if (!confirm('Confirmar que fará o pagamento direto ao organizador?')) return;

                                        setUploading(true);
                                        try {
                                            // Suportar tanto camelCase quanto snake_case (da API do Supabase)
                                            const targetCompanyId = stage.companyId || (stage as any).company_id;

                                            if (!targetCompanyId) {
                                                throw new Error('ID da empresa não encontrado. Entre em contato com o organizador.');
                                            }

                                            // Criar registro de pagamento pendente
                                            const paymentData = {
                                                team_id: team.id,
                                                stage_id: stage.id,
                                                company_id: targetCompanyId,
                                                amount: stage.registrationFee || 0,
                                                payment_method: 'direct',
                                                status: 'pending'
                                            };

                                            console.log('Criando pagamento direto:', paymentData);

                                            const { error: paymentError } = await supabase
                                                .from('payments')
                                                .insert(paymentData);

                                            if (paymentError) {
                                                console.error('Erro ao inserir pagamento:', paymentError);
                                                throw paymentError;
                                            }

                                            setPaymentCreated(true);
                                        } catch (error) {
                                            console.error('Erro ao criar pagamento:', error);
                                            alert('Erro ao solicitar pagamento direto. Tente novamente.');
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                    variant="secondary"
                                    disabled={uploading}
                                    className="w-full"
                                >
                                    Solicitar Pagamento Direto
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
