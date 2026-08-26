import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, Fish, ArrowRight, UserPlus } from 'lucide-react';

interface StageEvent {
    id: string;
    name: string;
    location: string;
    date: Date;
    circuitName: string;
    imageUrl?: string; // URL da imagem da etapa
}

interface Stats {
    circuits: number;
    fishPreserved: number;
    teams: number;
    stages: number;
}

export function HomePage() {
    const { companyName } = useParams();
    const [stats, setStats] = useState<Stats>({ circuits: 0, fishPreserved: 0, teams: 0, stages: 0 });
    const [upcomingStages, setUpcomingStages] = useState<StageEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [carouselImages, setCarouselImages] = useState<Array<{ url: string, mobileUrl?: string, link?: string }>>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [sponsorLogos, setSponsorLogos] = useState<any[]>([]);
    const [activeStageId, setActiveStageId] = useState<string | null>(null);
    const [heroTitle, setHeroTitle] = useState('PESCA ESPORTIVA COM CONSCIÊNCIA');
    const [heroSubtitle, setHeroSubtitle] = useState('Unindo esporte, técnica e paixão pela natureza. Pratique a pesca esportiva com responsabilidade e contribua para a preservação dos nossos rios e peixes.');

    useEffect(() => {
        loadCompanyAndData();
    }, [companyName]);

    useEffect(() => {
        if (carouselImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
            }, 8000); // Troca a cada 8 segundos
            return () => clearInterval(interval);
        }
    }, [carouselImages]);

    const loadCompanyAndData = async () => {
        try {
            setLoading(true);
            let currentCompanyId = null;

            if (companyName) {
                const { data: company } = await supabase
                    .from('users')
                    .select('id')
                    .eq('slug', companyName)
                    .single();

                if (company) {
                    currentCompanyId = company.id;
                } else {
                    console.error('Empresa não encontrada para o slug:', companyName);
                    setLoading(false);
                    return;
                }
            }

            await Promise.all([
                loadData(currentCompanyId),
                loadCarouselImages(currentCompanyId)
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCarouselImages = async (cId: string | null) => {
        try {
            let query = supabase
                .from('carousel_images')
                .select('url, mobile_url, link_url')
                .order('order', { ascending: true });

            if (cId) {
                query = query.eq('company_id', cId);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data && data.length > 0) {
                setCarouselImages(data.map((item: any) => ({
                    url: item.url,
                    mobileUrl: item.mobile_url,
                    link: item.link_url
                })));
            } else {
                setCarouselImages([{ url: '/tucunare-hero.jpg' }]);
            }
        } catch (error) {
            console.error('Erro ao carregar imagens do carrossel:', error);
            setCarouselImages([{ url: '/tucunare-hero.jpg' }]);
        }
    };

    const loadData = async (cId: string | null) => {
        try {
            let circuitsQuery = supabase.from('circuits').select('*', { count: 'exact', head: true });
            let teamsQuery = supabase.from('teams').select('*', { count: 'exact', head: true });
            let stagesQuery = supabase.from('stages').select('*', { count: 'exact', head: true });
            let resultsQuery = supabase.from('results').select('fish_measurements');

            if (cId) {
                circuitsQuery = circuitsQuery.eq('company_id', cId);
                teamsQuery = teamsQuery.eq('company_id', cId);
                stagesQuery = stagesQuery.eq('company_id', cId);
                resultsQuery = resultsQuery.eq('company_id', cId);
            }

            const { count: circuitsCount } = await circuitsQuery;
            const { count: teamsCount } = await teamsQuery;
            const { count: stagesCount } = await stagesQuery;

            const { data: results } = await resultsQuery;
            let fishCount = 0;
            if (results) {
                results.forEach((r: any) => {
                    fishCount += r.fish_measurements.filter((m: number) => m > 0).length;
                });
            }

            setStats({
                circuits: circuitsCount || 0,
                fishPreserved: fishCount,
                teams: teamsCount || 0,
                stages: stagesCount || 0
            });

            const today = new Date().toISOString();
            let stagesDataQuery = supabase
                .from('stages')
                .select('*, circuits(name)')
                .gte('date', today)
                .order('date', { ascending: true })
                .limit(3);

            if (cId) {
                stagesDataQuery = stagesDataQuery.eq('company_id', cId);
            }

            const { data: stagesData } = await stagesDataQuery;

                        if (stagesData && stagesData.length > 0) {
                const events = stagesData.map((stage: any) => ({
                    id: stage.id,
                    name: stage.name,
                    location: stage.location,
                    date: new Date(stage.date),
                    circuitName: stage.circuits?.name || 'Circuito',
                    imageUrl: stage.image_url
                }));
                setUpcomingStages(events);
                setActiveStageId(events[0].id);
            } else {
                let fallbackQuery = supabase
                    .from('stages')
                    .select('id')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (cId) {
                    fallbackQuery = fallbackQuery.eq('company_id', cId);
                }
                const { data: fallbackData } = await fallbackQuery;
                if (fallbackData && fallbackData.length > 0) {
                    setActiveStageId(fallbackData[0].id);
                }
            }

            if (cId) {
                const { data: siteSettings } = await supabase
                    .from('company_settings')
                    .select('hero_title, hero_subtitle, title, subtitle')
                    .eq('company_id', cId)
                    .maybeSingle();

                if (siteSettings) {
                    if (siteSettings.hero_title || siteSettings.title) {
                        setHeroTitle(siteSettings.hero_title || siteSettings.title);
                    }
                    if (siteSettings.hero_subtitle || siteSettings.subtitle) {
                        setHeroSubtitle(siteSettings.hero_subtitle || siteSettings.subtitle);
                    }
                }
            }

            const { data: sponsorsData } = await supabase
                .from('sponsor_logos')
                .select('*')
                .eq('active', true)
                .order('display_order', { ascending: true });

            if (sponsorsData) {
                setSponsorLogos(sponsorsData.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    imageUrl: s.image_url,
                    linkUrl: s.link_url
                })));
            }

        } catch (error) {
            console.error('Erro ao carregar dados da home:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Hero Section - Pure Carousel - Suporte Desktop & Mobile Separados */}
            <div className="relative w-full bg-slate-950">
                <div className="relative w-full overflow-hidden flex items-center justify-center min-h-[140px]">
                    {carouselImages.map((image, index) => {
                        const ImageWrapper = image.link ? 'a' : 'div';
                        const imageProps = image.link ? { href: image.link, target: '_blank', rel: 'noopener noreferrer' } : {};
                        const mUrl = image.mobileUrl;

                        return (
                            <ImageWrapper
                                key={index}
                                {...imageProps}
                                className={`w-full transition-opacity duration-700 ${index === currentImageIndex ? 'block opacity-100' : 'hidden opacity-0'
                                    } ${image.link ? 'cursor-pointer' : ''}`}
                            >
                                <picture className="w-full h-auto block">
                                    {mUrl && (
                                        <source media="(max-width: 768px)" srcSet={mUrl} />
                                    )}
                                    <img
                                        src={image.url}
                                        alt={`Slide ${index + 1}`}
                                        className="w-full h-auto max-h-[650px] object-contain mx-auto block"
                                    />
                                </picture>
                            </ImageWrapper>
                        );
                    })}
                </div>
            </div>

            {/* Hero Content Section with Stats */}
            <div className="bg-slate-900 py-20 border-b border-slate-800">
                <div className="container mx-auto px-4 text-center text-white">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight uppercase">
                        {heroTitle}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12">
                        {heroSubtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link
                            to={
                                activeStageId
                                    ? (companyName ? `/${companyName}/register/${activeStageId}` : `/register/${activeStageId}`)
                                    : (companyName ? `/${companyName}/etapas` : '/etapas')
                            }
                            className="px-10 py-5 bg-primary hover:opacity-90 text-white rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-3 tracking-wide uppercase"
                        >
                            <UserPlus className="w-6 h-6" />
                            INSCREVA-SE
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
                        <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700 hover:border-blue-500/50 transition-colors group backdrop-blur-sm">
                            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                                {stats.circuits}
                            </div>
                            <div className="text-gray-200 uppercase tracking-wider text-sm font-medium">Circuitos Ativos</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700 hover:border-blue-500/50 transition-colors group backdrop-blur-sm">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                                {stats.fishPreserved}+
                            </div>
                            <div className="text-gray-200 uppercase tracking-wider text-sm font-medium">Peixes Preservados</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700 hover:border-blue-500/50 transition-colors group backdrop-blur-sm">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                                {stats.teams}
                            </div>
                            <div className="text-gray-200 uppercase tracking-wider text-sm font-medium">Equipes Inscritas</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-800/70 border border-slate-700 hover:border-blue-500/50 transition-colors group backdrop-blur-sm">
                            <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                                {stats.stages}
                            </div>
                            <div className="text-gray-200 uppercase tracking-wider text-sm font-medium">Etapas Realizadas</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Events Section */}
            <div id="eventos" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Próximos Eventos</h2>
                            <div className="h-1 w-20 bg-primary rounded-full"></div>
                        </div>
                        <Link to={companyName ? `/${companyName}/ranking` : '/ranking'} className="hidden md:flex items-center text-primary font-semibold hover:opacity-80 transition-colors">
                            Ver todos os resultados <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : upcomingStages.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-8">
                            {upcomingStages.map((stage) => (
                                <div key={stage.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col">
                                    <div className="h-48 bg-slate-800 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                                        {stage.imageUrl ? (
                                            <img
                                                src={stage.imageUrl}
                                                alt={stage.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                                                <Fish className="w-16 h-16 text-slate-600" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 left-4 z-20">
                                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                                                {stage.circuitName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center text-gray-500 text-sm mb-3">
                                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                            {stage.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {stage.name}
                                        </h3>
                                        <div className="flex items-center text-gray-600 mb-6">
                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                            {stage.location}
                                        </div>
                                        <div className="mt-auto pt-6 border-t border-gray-100">
                                            <Link
                                                to={`/register/${stage.id}`}
                                                className="block w-full py-3 text-center bg-slate-900 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                Inscrever-se
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <Fish className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-500">Nenhum evento programado para os próximos dias.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sponsors Section */}
            <div className="py-16 bg-gray-50 border-t border-gray-200 overflow-hidden">
                <div className="container mx-auto px-4 text-center mb-8">
                    <h3 className="text-gray-400 font-semibold uppercase tracking-widest">Patrocinadores Oficiais</h3>
                </div>

                <div className="relative w-full overflow-hidden">
                    <div className="flex w-max animate-scroll hover:pause">
                        <div className="flex items-center gap-16 px-8">
                            {sponsorLogos.length > 0 ? (
                                sponsorLogos.map((sponsor) => (
                                    <a
                                        key={sponsor.id}
                                        href={sponsor.linkUrl || '#'}
                                        target={sponsor.linkUrl ? "_blank" : "_self"}
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                                        title={sponsor.name}
                                    >
                                        <img
                                            src={sponsor.imageUrl}
                                            alt={sponsor.name}
                                            className="h-16 w-auto max-w-[200px] object-contain"
                                        />
                                    </a>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-slate-800 opacity-50">
                                        <Fish className="w-8 h-8 text-blue-600" />
                                        <span>FISHING CO.</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-slate-800 opacity-50">
                                        <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
                                        <span>MARINE SPORTS</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-slate-800 opacity-50">
                                        <div className="w-8 h-8 bg-red-600 transform rotate-45"></div>
                                        <span>SHIMANO</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-slate-800 opacity-50">
                                        <div className="w-8 h-8 border-4 border-black rounded-lg"></div>
                                        <span>MERCURY</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {sponsorLogos.length > 0 && (
                            <div className="flex items-center gap-16 px-8">
                                {sponsorLogos.map((sponsor) => (
                                    <a
                                        key={`${sponsor.id}-duplicate`}
                                        href={sponsor.linkUrl || '#'}
                                        target={sponsor.linkUrl ? "_blank" : "_self"}
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                                        title={sponsor.name}
                                    >
                                        <img
                                            src={sponsor.imageUrl}
                                            alt={sponsor.name}
                                            className="h-16 w-auto max-w-[200px] object-contain"
                                        />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-scroll {
                        animation: scroll 30s linear infinite;
                    }
                    .hover\\:pause:hover {
                        animation-play-state: paused;
                    }
                `}</style>
            </div>

            <Footer />
        </div>
    );
}
