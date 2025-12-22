import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Footer() {
    const { companyName } = useParams();
    const [settings, setSettings] = useState({
        contactEmail: 'contato@circuitopesca.com.br',
        contactPhone: '(11) 99999-9999',
        contactAddress: 'Av. da Pesca, 1000\nSão Paulo - SP',
        socialInstagram: '',
        socialFacebook: '',
        socialYoutube: ''
    });

    useEffect(() => {
        loadSettings();
    }, [companyName]);

    const loadSettings = async () => {
        // Se não tiver companyName na URL, usar valores padrão
        if (!companyName) {
            return;
        }

        try {
            // Buscar empresa pelo slug
            const { data: company } = await supabase
                .from('users')
                .select('id')
                .eq('slug', companyName)
                .eq('role', 'company')
                .single();

            if (company) {
                //Buscar configurações da empresa
                const { data: companySettings } = await supabase
                    .from('company_settings')
                    .select('*')
                    .eq('company_id', company.id)
                    .single();

                if (companySettings) {
                    setSettings({
                        contactEmail: companySettings.contact_email || 'contato@circuitopesca.com.br',
                        contactPhone: companySettings.contact_phone || '(11) 99999-9999',
                        contactAddress: companySettings.contact_address || 'Av. da Pesca, 1000\nSão Paulo - SP',
                        socialInstagram: companySettings.social_instagram || '',
                        socialFacebook: companySettings.social_facebook || '',
                        socialYoutube: companySettings.social_youtube || ''
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar configurações do footer:', error);
        }
    };

    const hasSocialMedia = settings.socialInstagram || settings.socialFacebook || settings.socialYoutube;

    return (
        <footer className="bg-gray-900 text-white pt-12 pb-8">
            <div className="container mx-auto px-4">
                <div className={`grid grid-cols-1 ${hasSocialMedia ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-8 mb-8`}>
                    {/* About */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-blue-400">Circuito Pesca</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Promovendo a pesca esportiva e a preservação ambiental através de competições organizadas e profissionais.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Links Úteis</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <Link to={companyName ? `/${companyName}` : '/'} className="hover:text-blue-400 transition-colors">Início</Link>
                            </li>
                            <li>
                                <Link to={companyName ? `/${companyName}/ranking` : '/ranking'} className="hover:text-blue-400 transition-colors">Rankings</Link>
                            </li>
                            <li>
                                <Link to={companyName ? `/${companyName}/regulamentos` : '/regulamentos'} className="hover:text-blue-400 transition-colors">Regulamento</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Contato</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <span>{settings.contactPhone}</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <span className="break-all">{settings.contactEmail}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                                <span className="whitespace-pre-line">{settings.contactAddress}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Social */}
                    {hasSocialMedia && (
                        <div>
                            <h3 className="text-lg font-bold mb-4">Siga-nos</h3>
                            <div className="flex gap-4">
                                {settings.socialInstagram && (
                                    <a
                                        href={settings.socialInstagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-gray-800 p-2 rounded-full hover:bg-pink-600 transition-colors"
                                        title="Instagram"
                                    >
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                )}
                                {settings.socialFacebook && (
                                    <a
                                        href={settings.socialFacebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-gray-800 p-2 rounded-full hover:bg-blue-600 transition-colors"
                                        title="Facebook"
                                    >
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                )}
                                {settings.socialYoutube && (
                                    <a
                                        href={settings.socialYoutube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-gray-800 p-2 rounded-full hover:bg-red-600 transition-colors"
                                        title="YouTube"
                                    >
                                        <Youtube className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Circuito de Pesca Esportiva. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
