import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Fish } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('=== LOGIN ATTEMPT START ===');
        console.log('Email:', email);
        console.log('Time:', new Date().toISOString());

        try {
            console.log('[1/2] Chamando signIn...');
            await signIn(email, password);

            console.log('[2/2] SignIn completou! Navegando...');
            navigate('/admin');

            console.log('✅ Login concluído com sucesso!');
        } catch (err: any) {
            console.error('❌ Login error:', err);
            console.error('Error type:', err.constructor.name);
            console.error('Error message:', err.message);
            setError(err.message || 'E-mail ou senha incorretos');
        } finally {
            console.log('=== LOGIN ATTEMPT END ===');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-ocean-600 to-fishing-600 flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-ocean-100 rounded-full mb-4">
                        <Fish className="w-8 h-8 text-ocean-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Circuitos de Pesca
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Faça login para acessar o painel
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="E-mail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        disabled={loading}
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={loading}
                    />

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            <strong>Erro:</strong> {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div className="mt-6 p-4 bg-ocean-50 border border-ocean-200 rounded-lg">
                    <p className="text-sm text-ocean-800 text-center">
                        🎣 Bem-vindo ao sistema de gerenciamento de Circuitos de Pesca Esportiva.<br />
                        <span className="text-xs text-ocean-600">Entre com suas credenciais para acessar o painel administrativo.</span>
                    </p>
                </div>
            </Card>
        </div>
    );
}
