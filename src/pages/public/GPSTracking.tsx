import { useState } from 'react';
import { MapPin, Navigation, Power, LogOut } from 'lucide-react';
import { useGPSTracking } from '../../hooks/useGPSTracking';
import { validateGPSAccessKey } from '../../lib/gps';

export default function GPSTracking() {
    const [accessKey, setAccessKey] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [teamInfo, setTeamInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { position, error: gpsError } = useGPSTracking(
        teamInfo?.teams?.id || '',
        teamInfo?.stages?.id || '',
        isTracking
    );

    const handleLogin = async () => {
        if (!accessKey.trim()) {
            setError('Digite a chave de acesso');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await validateGPSAccessKey(accessKey.toUpperCase());


            if (response.valid) {
                setTeamInfo(response.data);
                setIsLoggedIn(true);
            } else {
                setError(response.message || 'Chave de acesso inválida');
            }
        } catch (err) {
            setError('Erro ao validar chave de acesso');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        setIsTracking(false);
        setIsLoggedIn(false);
        setAccessKey('');
        setTeamInfo(null);
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-block bg-blue-100 p-4 rounded-full mb-4">
                            <MapPin className="w-12 h-12 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            GPS Tracker
                        </h1>
                        <p className="text-gray-600">
                            Rastreamento de Embarcações
                        </p>
                    </div>

                    {/* Login Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chave de Acesso
                            </label>
                            <input
                                type="text"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                                placeholder="ABC123-XYZ789"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                                maxLength={13}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Conectando...' : 'Conectar'}
                        </button>

                        <p className="text-xs text-gray-500 text-center mt-4">
                            Use a chave fornecida no momento da inscrição
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            {/* Header */}
            <div className="bg-blue-600 p-4 shadow-lg">
                <div className="container mx-auto flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">{teamInfo?.teams?.team_name}</h2>
                        <p className="text-sm opacity-90">{teamInfo?.stages?.name}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto p-4 space-y-4">
                {/* Status Card */}
                <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Navigation className={`w-6 h-6 ${isTracking ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
                            <span className="text-lg font-semibold">
                                {isTracking ? 'Rastreamento Ativo' : 'Rastreamento Pausado'}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsTracking(!isTracking)}
                            className={`p-3 rounded-full transition-all ${isTracking
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            <Power className="w-6 h-6" />
                        </button>
                    </div>

                    {/* GPS Info */}
                    {position && (
                        <div className="bg-slate-700 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Latitude:</span>
                                <span className="font-mono">{position.latitude.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Longitude:</span>
                                <span className="font-mono">{position.longitude.toFixed(6)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Precisão:</span>
                                <span className="font-mono">{Math.round(position.accuracy)}m</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Última atualização:</span>
                                <span className="font-mono">
                                    {new Date(position.timestamp).toLocaleTimeString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    )}

                    {gpsError && (
                        <div className="bg-red-900 bg-opacity-50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm mt-4">
                            <strong>Erro GPS:</strong> {gpsError}
                        </div>
                    )}

                    {!position && isTracking && !gpsError && (
                        <div className="text-center text-gray-400 py-4">
                            <p>Aguardando sinal GPS...</p>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-xl p-4">
                    <p className="text-sm text-blue-200">
                        <strong>💡 Dica:</strong> Mantenha o app aberto durante o evento para enviar sua localização em tempo real.
                    </p>
                </div>
            </div>
        </div>
    );
}
