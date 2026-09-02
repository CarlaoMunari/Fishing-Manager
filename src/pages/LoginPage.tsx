import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Fish, ShieldCheck } from "lucide-react";

export function LoginPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        setLoading(true);

        try {
            if (mode === "login") {
                await signIn(email, password);

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: userProfile } = await supabase
                        .from("users")
                        .select("role")
                        .eq("id", session.user.id)
                        .single();

                    if (userProfile?.role === "captain") {
                        navigate("/pescador");
                    } else {
                        navigate("/admin");
                    }
                } else {
                    navigate("/admin");
                }
            } else {
                if (!name.trim()) {
                    throw new Error("Por favor, preencha o seu nome completo.");
                }

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password: password,
                    options: {
                        data: {
                            name: name.trim(),
                            role: "captain"
                        }
                    }
                });

                if (authError) throw authError;

                if (authData.user) {
                    await supabase.from("users").insert({
                        id: authData.user.id,
                        email: email.trim(),
                        name: name.trim(),
                        role: "captain",
                        must_change_password: false
                    });

                    setSuccessMsg("Conta de Pescador criada com sucesso! Faça login abaixo.");
                    setMode("login");
                }
            }
        } catch (err: any) {
            console.error("Login/SignUp error:", err);
            setError(err.message || "Erro ao processar autenticação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center px-4 py-8 safe-top">
            <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800 text-white p-6 md:p-8 shadow-2xl space-y-6">
                {/* Header Logo */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
                        <Fish className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-white">
                        Fishing Manager
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        {mode === "login"
                            ? "Entre para acessar o painel de Pescador ou Admin"
                            : "Crie sua conta de Capitão/Pescador"}
                    </p>
                </div>

                {/* Tabs Select */}
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                        onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            mode === "login" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => { setMode("signup"); setError(""); setSuccessMsg(""); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            mode === "signup" ? "bg-blue-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Cadastrar Pescador
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                        <div>
                            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                                Nome Completo
                            </label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome ou nome do capitão"
                                required
                                disabled={loading}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                            E-mail
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            disabled={loading}
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                            Senha
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>

                    {successMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-xl text-xs font-semibold">
                            <strong>Erro:</strong> {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                        disabled={loading}
                    >
                        {loading
                            ? "Aguarde..."
                            : mode === "login"
                            ? "Entrar no Sistema"
                            : "Criar Conta de Capitão"}
                    </Button>
                </form>

                <div className="text-center pt-2 border-t border-slate-800">
                    <Link to="/" className="text-xs text-gray-400 hover:text-white transition-colors">
                        ← Voltar para a Página Inicial
                    </Link>
                </div>
            </Card>
        </div>
    );
}

