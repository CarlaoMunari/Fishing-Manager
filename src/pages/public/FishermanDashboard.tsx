import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Navbar } from "../../components/public/Navbar";
import { Footer } from "../../components/public/Footer";
import {
    Anchor,
    Users,
    Calendar,
    Trophy,
    MapPin,
    ShieldCheck,
    Navigation,
    CreditCard,
    Save,
    CheckCircle2,
    Clock,
    Plus
} from "lucide-react";

export function FishermanDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<"registrations" | "team" | "rankings">("registrations");
    const [loading, setLoading] = useState(true);
    const [teamRegistrations, setTeamRegistrations] = useState<any[]>([]);
    const [gpsKeys, setGpsKeys] = useState<{ [teamId: string]: string }>({});

    // Team Profile State (reusable across any company)
    const [teamName, setTeamName] = useState("");
    const [city, setCity] = useState("");
    const [responsibleName, setResponsibleName] = useState(currentUser?.name || "");
    const [responsiblePhone, setResponsiblePhone] = useState("");
    const [responsiblePhone2, setResponsiblePhone2] = useState("");
    const [members, setMembers] = useState<Array<{ name: string; nickname: string; rg: string }>>([
        { name: "", nickname: "", rg: "" },
        { name: "", nickname: "", rg: "" },
        { name: "", nickname: "", rg: "" },
        { name: "", nickname: "", rg: "" },
    ]);

    const [saveSuccess, setSaveSuccess] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadFishermanData();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const loadFishermanData = async () => {
        setLoading(true);
        try {
            if (!currentUser) return;

            // Load saved team profile from localStorage or database
            const savedProfile = localStorage.getItem(`fisherman_profile_${currentUser.id}`);
            if (savedProfile) {
                try {
                    const parsed = JSON.parse(savedProfile);
                    setTeamName(parsed.teamName || "");
                    setCity(parsed.city || "");
                    setResponsibleName(parsed.responsibleName || currentUser.name || "");
                    setResponsiblePhone(parsed.responsiblePhone || "");
                    setResponsiblePhone2(parsed.responsiblePhone2 || "");
                    if (parsed.members && parsed.members.length === 4) {
                        setMembers(parsed.members);
                    }
                } catch (e) {
                    console.error("Error parsing saved profile:", e);
                }
            }

            // Search teams registered with user_id OR user email
            const { data: teamsData } = await supabase
                .from("teams")
                .select(`
                    *,
                    stages (id, name, date, location, circuit_id, company_id, circuits(name, year))
                `)
                .or(`user_id.eq.${currentUser.id},responsible_email.eq.${currentUser.email}`)
                .order("registered_at", { ascending: false });

            if (teamsData) {
                setTeamRegistrations(teamsData);

                // Auto populate profile from latest team if not set
                if (teamsData.length > 0 && (!teamName || !city)) {
                    const latest = teamsData[0];
                    setTeamName(latest.team_name || "");
                    setCity(latest.city || "");
                    setResponsibleName(latest.responsible_name || currentUser.name || "");
                    setResponsiblePhone(latest.responsible_phone || "");
                    setResponsiblePhone2(latest.responsible_phone2 || "");
                    if (latest.members && Array.isArray(latest.members)) {
                        setMembers(latest.members);
                    }
                }

                // Fetch active GPS access keys for paid registrations
                const paidTeamIds = teamsData.filter(t => t.paid).map(t => t.id);
                if (paidTeamIds.length > 0) {
                    const { data: keysData } = await supabase
                        .from("gps_access_keys")
                        .select("*")
                        .in("team_id", paidTeamIds)
                        .eq("is_active", true);

                    if (keysData) {
                        const keyMap: { [teamId: string]: string } = {};
                        keysData.forEach((k: any) => {
                            keyMap[k.team_id] = k.access_key;
                        });
                        setGpsKeys(keyMap);
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados do pescador:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setSaveSuccess(false);

        try {
            if (currentUser) {
                const profileData = {
                    teamName,
                    city,
                    responsibleName,
                    responsibleEmail: currentUser.email,
                    responsiblePhone,
                    responsiblePhone2,
                    members,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem(`fisherman_profile_${currentUser.id}`, JSON.stringify(profileData));
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
            }
        } catch (err) {
            console.error("Erro ao salvar perfil:", err);
        } finally {
            setSavingProfile(false);
        }
    };

    const updateMember = (index: number, field: "name" | "nickname" | "rg", value: string) => {
        const updated = [...members];
        updated[index] = { ...updated[index], [field]: value };
        setMembers(updated);
    };

    const memberLabels = ["Capitão (Responsável)", "2º Pescador", "3º Pescador", "Reservante / Apoio"];

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
                <Navbar />
                <div className="container mx-auto px-4 py-16 text-center max-w-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
                        <Anchor className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
                        <h2 className="text-2xl font-bold">Área do Pescador</h2>
                        <p className="text-sm text-gray-400">
                            Faça login com a sua conta de Capitão/Pescador para gerenciar a sua equipe e inscrições.
                        </p>
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
                        >
                            Entrar ou Criar Conta
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-mobile-nav">
            <Navbar />

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white py-8 shadow-xl">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600/30 p-3 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                                <Anchor className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div>
                                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                                    Painel do Capitão & Pescador
                                </span>
                                <h1 className="text-2xl md:text-3xl font-black text-white">
                                    {teamName || currentUser.name || "Minha Equipe"}
                                </h1>
                            </div>
                        </div>

                        <Link
                            to="/etapas"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-5 rounded-xl shadow-lg transition-all active:scale-95 text-sm"
                        >
                            <Plus className="w-4 h-4" /> Inscrever em Nova Etapa
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab("registrations")}
                            className={`py-3.5 px-5 font-bold text-sm text-center border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                                activeTab === "registrations"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            <Calendar className="w-4 h-4" /> Minhas Inscrições ({teamRegistrations.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("team")}
                            className={`py-3.5 px-5 font-bold text-sm text-center border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                                activeTab === "team"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            <Users className="w-4 h-4" /> Perfil da Equipe Salvo
                        </button>
                        <button
                            onClick={() => setActiveTab("rankings")}
                            className={`py-3.5 px-5 font-bold text-sm text-center border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
                                activeTab === "rankings"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            <Trophy className="w-4 h-4" /> Meus Rankings
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 py-6 max-w-5xl flex-grow">
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-sm font-medium text-gray-600">Carregando painel do pescador...</p>
                    </div>
                ) : activeTab === "registrations" ? (
                    /* Registrations Tab */
                    <div className="space-y-4">
                        {teamRegistrations.length === 0 ? (
                            <div className="bg-white rounded-3xl p-8 text-center border border-gray-200 shadow-sm space-y-4">
                                <Calendar className="w-12 h-12 text-gray-400 mx-auto" />
                                <h3 className="text-lg font-bold text-gray-800">Nenhuma inscrição encontrada</h3>
                                <p className="text-xs text-gray-500 max-w-md mx-auto">
                                    Sua equipe ainda não se inscreveu em nenhuma etapa. Navegue pelas etapas disponíveis em qualquer organizador e inscreva-se!
                                </p>
                                <Link
                                    to="/etapas"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition-colors"
                                >
                                    Ver Etapas Abertas
                                </Link>
                            </div>
                        ) : (
                            teamRegistrations.map((team) => {
                                const stage = team.stages;
                                const gpsKey = gpsKeys[team.id];

                                return (
                                    <div
                                        key={team.id}
                                        className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-all"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                            <div>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                                    {stage?.circuits?.name || "Circuito de Pesca"}
                                                </span>
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                                    {stage?.name || "Etapa Esportiva"}
                                                </h3>
                                            </div>

                                            <div>
                                                {team.paid ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Inscrição Confirmada
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Pagamento Pendente
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                                                <span>{stage?.location || "Local da Etapa"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Users className="w-4 h-4 text-blue-500 shrink-0" />
                                                <span>Equipe: <strong>{team.team_name}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                                                <span>
                                                    Data: {stage?.date ? new Date(stage.date).toLocaleDateString("pt-BR") : "--"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* GPS Key & Tracker Direct Shortcut */}
                                        {team.paid && gpsKey ? (
                                            <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800">
                                                <div>
                                                    <span className="text-[10px] font-semibold uppercase text-cyan-400 tracking-wider block">
                                                        Chave de Rastreamento GPS
                                                    </span>
                                                    <span className="text-xl font-extrabold font-mono text-white tracking-widest">
                                                        {gpsKey}
                                                    </span>
                                                </div>

                                                <Link
                                                    to="/gps"
                                                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                                                >
                                                    <Navigation className="w-4 h-4 animate-pulse" />
                                                    Iniciar Rastreamento GPS
                                                </Link>
                                            </div>
                                        ) : !team.paid ? (
                                            <div className="flex justify-end pt-2">
                                                <Link
                                                    to="/checkout"
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                                                >
                                                    <CreditCard className="w-3.5 h-3.5" /> Concluir Pagamento
                                                </Link>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : activeTab === "team" ? (
                    /* Team Profile Tab */
                    <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" /> Perfil Reutilizável da Equipe
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Salve aqui os dados da sua equipe. Quando você for se inscrever na etapa de <strong>qualquer empresa</strong>, todos esses campos serão preenchidos automaticamente!
                            </p>
                        </div>

                        {saveSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Perfil salvo com sucesso! Seus dados serão usados nas próximas inscrições.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Nome da Equipe *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="Ex: Equipe Tucunaré Master"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Cidade da Equipe *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Ex: São Paulo"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Telefone Principal (WhatsApp) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={responsiblePhone}
                                    onChange={(e) => setResponsiblePhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Telefone Secundário (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={responsiblePhone2}
                                    onChange={(e) => setResponsiblePhone2(e.target.value)}
                                    placeholder="(11) 98888-8888"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-sm"
                                />
                            </div>
                        </div>

                        {/* Members Section */}
                        <div className="pt-4 border-t border-gray-200 space-y-4">
                            <h4 className="font-bold text-sm text-gray-900">Integrantes da Equipe</h4>
                            {members.map((member, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 space-y-3">
                                    <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                                        {memberLabels[idx]}
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <input
                                            type="text"
                                            value={member.name}
                                            onChange={(e) => updateMember(idx, "name", e.target.value)}
                                            placeholder="Nome completo"
                                            className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-medium"
                                        />
                                        <input
                                            type="text"
                                            value={member.nickname}
                                            onChange={(e) => updateMember(idx, "nickname", e.target.value)}
                                            placeholder="Apelido"
                                            className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-medium"
                                        />
                                        <input
                                            type="text"
                                            value={member.rg}
                                            onChange={(e) => updateMember(idx, "rg", e.target.value)}
                                            placeholder="RG ou CPF"
                                            className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-medium"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-sm"
                            >
                                <Save className="w-4 h-4" /> {savingProfile ? "Salvando..." : "Salvar Perfil Reutilizável"}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Rankings Tab */
                    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" /> Meus Circuitos Inscritos
                        </h3>
                        <p className="text-xs text-gray-500">
                            Acompanhe abaixo o ranking das etapas dos circuitos em que sua equipe já participou:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <Link
                                to="/ranking"
                                className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 transition-all flex items-center justify-between"
                            >
                                <div>
                                    <h4 className="font-bold text-sm text-blue-900">Ver Classificação Geral</h4>
                                    <p className="text-xs text-blue-700">Acesse o ranking completo do circuito</p>
                                </div>
                                <Trophy className="w-5 h-5 text-blue-600 shrink-0" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

