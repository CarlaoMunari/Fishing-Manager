import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "../../components/public/Navbar";
import { Footer } from "../../components/public/Footer";
import { supabase } from "../../lib/supabase";
import { parseLocalDate } from "../../lib/dateUtils";
import { Calendar, MapPin, ArrowRight, UserPlus } from "lucide-react";

interface StageEvent {
    id: string;
    name: string;
    location: string;
    date: Date;
    circuitName: string;
    imageUrl?: string;
}

export function HomePage() {
    const { companyName } = useParams();
    const [upcomingStages, setUpcomingStages] = useState<StageEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [carouselImages, setCarouselImages] = useState<Array<{ url: string, mobileUrl?: string, link?: string }>>([]);
    const [currentImageIndex] = useState(0);

    useEffect(() => {
        loadPageData();
    }, [companyName]);

    const loadPageData = async () => {
        setLoading(true);
        try {
            let cId: string | null = null;
            if (companyName) {
                const { data: comp } = await supabase
                    .from("users")
                    .select("id")
                    .eq("slug", companyName)
                    .single();
                if (comp) cId = comp.id;
            }

            const today = new Date().toISOString();
            let stagesDataQuery = supabase
                .from("stages")
                .select("*, circuits(name)")
                .gte("date", today)
                .order("date", { ascending: true })
                .limit(3);

            if (cId) {
                stagesDataQuery = stagesDataQuery.eq("company_id", cId);
            }

            const { data: stagesData } = await stagesDataQuery;

            if (stagesData && stagesData.length > 0) {
                const events = stagesData.map((stage: any) => ({
                    id: stage.id,
                    name: stage.name,
                    location: stage.location,
                    date: parseLocalDate(stage.date),
                    circuitName: stage.circuits?.name || "Circuito",
                    imageUrl: stage.image_url
                }));
                setUpcomingStages(events);
            } else {
                let fallbackQuery = supabase
                    .from("stages")
                    .select("*, circuits(name)")
                    .order("created_at", { ascending: false })
                    .limit(3);

                if (cId) fallbackQuery = fallbackQuery.eq("company_id", cId);

                const { data: fallbackData } = await fallbackQuery;
                if (fallbackData && fallbackData.length > 0) {
                    const events = fallbackData.map((stage: any) => ({
                        id: stage.id,
                        name: stage.name,
                        location: stage.location,
                        date: parseLocalDate(stage.date),
                        circuitName: stage.circuits?.name || "Circuito",
                        imageUrl: stage.image_url
                    }));
                    setUpcomingStages(events);
                }
            }

            let carouselQuery = supabase
                .from("carousel_images")
                .select("*")
                .eq("active", true)
                .order("order_index", { ascending: true });

            if (cId) {
                carouselQuery = carouselQuery.eq("company_id", cId);
            }

            const { data: carData } = await carouselQuery;
            if (carData && carData.length > 0) {
                setCarouselImages(carData.map(img => ({
                    url: img.image_url,
                    mobileUrl: img.mobile_image_url || img.image_url,
                    link: img.link_url
                })));
            }
        } catch (error) {
            console.error("Erro ao carregar dados da home:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-mobile-nav">
            <Navbar />

            {/* Banner Carousel */}
            {carouselImages.length > 0 && (
                <div className="relative w-full h-[220px] sm:h-[350px] md:h-[450px] overflow-hidden bg-slate-950">
                    {carouselImages.map((img, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                            }`}
                        >
                            <img
                                src={img.url}
                                alt={`Banner ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Upcoming Stages Section */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                Calendário de Provas
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
                                Próximas Etapas
                            </h2>
                        </div>

                        <Link
                            to={companyName ? `/${companyName}/etapas` : "/etapas"}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            Ver todas as etapas <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto" />
                        </div>
                    ) : upcomingStages.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-8 text-center text-gray-500 text-sm">
                            Nenhuma próxima etapa agendada no momento.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {upcomingStages.map((stage) => (
                                <div
                                    key={stage.id}
                                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    {stage.imageUrl && (
                                        <div className="h-44 w-full overflow-hidden bg-slate-900">
                                            <img
                                                src={stage.imageUrl}
                                                alt={stage.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    )}

                                    <div className="p-5 flex-grow space-y-3">
                                        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold">
                                            <Calendar className="w-4 h-4 shrink-0" />
                                            <span>
                                                {stage.date.toLocaleDateString("pt-BR", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>

                                        <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                                            {stage.name}
                                        </h3>

                                        <div className="flex items-center text-xs text-gray-500 gap-1.5">
                                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span>{stage.location}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 pt-0">
                                        <Link
                                            to={companyName ? `/${companyName}/register/${stage.id}` : `/register/${stage.id}`}
                                            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors active:scale-95"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Inscrever-se
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}

