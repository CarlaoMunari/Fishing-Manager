import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/lib/supabase';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, RefreshCw, Clock, Copy, Check } from 'lucide-react';

interface GPSLocation {
    id: string;
    teamId: string;
    teamName: string;
    gpsAccessKey: string | null;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    speed: number | null;
    timestamp: Date;
    createdAt: Date;
}

interface Stage {
    id: string;
    name: string;
    circuitId: string;
    circuitName: string;
    gpsTrackingEnabled: boolean;
    gpsStartTime: string | null;
    gpsEndTime: string | null;
}

interface Circuit {
    id: string;
    name: string;
}

interface TeamWithGPS {
    id: string;
    teamName: string;
    city: string;
    gpsAccessKey: string | null;
    responsibleName: string;
}

const mapContainerStyle = {
    width: '100%',
    height: '600px'
};

const defaultCenter: [number, number] = [-15.7942, -47.8822];

const createNumberedIcon = (number: number) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: #3B82F6;
                color: white;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${number}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

export function LocationTracking() {
    const { companyId } = useCompany();
    const [circuits, setCircuits] = useState<Circuit[]>([]);
    const [selectedCircuit, setSelectedCircuit] = useState<string>('');
    const [stages, setStages] = useState<Stage[]>([]);
    const [selectedStage, setSelectedStage] = useState<string>('');
    const [teamsWithGPS, setTeamsWithGPS] = useState<TeamWithGPS[]>([]);
    const [locations, setLocations] = useState<GPSLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [teamPath, setTeamPath] = useState<[number, number][]>([]);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        loadCircuits();
    }, [companyId]);

    useEffect(() => {
        if (selectedCircuit) {
            loadStages();
        } else {
            setStages([]);
            setSelectedStage('');
        }
    }, [selectedCircuit]);

    useEffect(() => {
        if (selectedStage) {
            loadTeamsWithGPS();
            loadLocations();
            const interval = setInterval(loadLocations, 10000);
            return () => clearInterval(interval);
        }
    }, [selectedStage]);

    const loadCircuits = async () => {
        try {
            console.log('🔍 Loading circuits for company:', companyId);

            let query = supabase
                .from('circuits')
                .select('id, name, company_id');

            // Se não é super_admin, filtrar por company_id
            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error loading circuits:', error);
                throw error;
            }

            console.log('✅ Circuits loaded:', data);
            console.log('📊 Number of circuits:', data?.length);
            setCircuits(data);
        } catch (error) {
            console.error('💥 Erro ao carregar circuitos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStages = async () => {
        try {
            let query = supabase
                .from('stages')
                .select(`
                    id, 
                    name, 
                    circuit_id,
                    gps_tracking_enabled, 
                    gps_start_time, 
                    gps_end_time,
                    circuits (name)
                `)
                .eq('circuit_id', selectedCircuit)
                .eq('gps_tracking_enabled', true)
                .order('date', { ascending: false });

            // Filtrar por company apenas se não for super_admin
            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedStages = data.map((s: any) => ({
                id: s.id,
                name: s.name,
                circuitId: s.circuit_id,
                circuitName: s.circuits?.name || '',
                gpsTrackingEnabled: s.gps_tracking_enabled,
                gpsStartTime: s.gps_start_time,
                gpsEndTime: s.gps_end_time
            }));

            setStages(formattedStages);

            if (formattedStages.length > 0) {
                setSelectedStage(formattedStages[0].id);
            } else {
                setSelectedStage('');
            }
        } catch (error) {
            console.error('Erro ao carregar etapas:', error);
        }
    };

    const loadTeamsWithGPS = async () => {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select(`
                    id,
                    team_name,
                    city,
                    responsible_name,
                    gps_access_keys (
                        access_key
                    )
                `)
                .eq('stage_id', selectedStage);

            if (error) throw error;

            const formattedTeams: TeamWithGPS[] = data.map((team: any) => ({
                id: team.id,
                teamName: team.team_name,
                city: team.city,
                responsibleName: team.responsible_name,
                gpsAccessKey: team.gps_access_keys?.[0]?.access_key || null
            }));

            setTeamsWithGPS(formattedTeams);
        } catch (error) {
            console.error('Erro ao carregar equipes:', error);
        }
    };

    const generateMissingGPSKeys = async () => {
        if (!selectedStage) return;

        try {
            const { createGPSAccessKey } = await import('@/lib/gps');
            let generated = 0;

            for (const team of teamsWithGPS) {
                if (!team.gpsAccessKey) {
                    const { data, error } = await createGPSAccessKey(team.id, selectedStage);
                    if (!error && data) {
                        console.log(`Chave GPS gerada para ${team.teamName}:`, data.access_key);
                        generated++;
                    }
                }
            }

            if (generated > 0) {
                alert(`${generated} código(s) GPS gerado(s) com sucesso!`);
                await loadTeamsWithGPS(); // Recarregar lista
            } else {
                alert('Todas as equipes já possuem códigos GPS');
            }
        } catch (error) {
            console.error('Erro ao gerar códigos GPS:', error);
            alert('Erro ao gerar códigos GPS');
        }
    };

    const loadLocations = async () => {
        if (!selectedStage) return;

        setRefreshing(true);
        try {
            const { data, error } = await supabase
                .from('gps_locations')
                .select(`
                    id,
                    team_id,
                    latitude,
                    longitude,
                    accuracy,
                    speed,
                    timestamp,
                    created_at,
                    teams (
                        team_name,
                        gps_access_keys (access_key)
                    )
                `)
                .eq('stage_id', selectedStage)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const latestByTeam = new Map<string, any>();
            data.forEach((loc: any) => {
                if (!latestByTeam.has(loc.team_id)) {
                    latestByTeam.set(loc.team_id, loc);
                }
            });

            const formattedLocations: GPSLocation[] = Array.from(latestByTeam.values()).map((loc: any) => ({
                id: loc.id,
                teamId: loc.team_id,
                teamName: loc.teams?.team_name || 'Equipe desconhecida',
                gpsAccessKey: loc.teams?.gps_access_keys?.[0]?.access_key || null,
                latitude: parseFloat(loc.latitude),
                longitude: parseFloat(loc.longitude),
                accuracy: loc.accuracy,
                speed: loc.speed,
                timestamp: new Date(loc.timestamp),
                createdAt: new Date(loc.created_at)
            }));

            setLocations(formattedLocations);

            if (formattedLocations.length > 0) {
                setMapCenter([
                    formattedLocations[0].latitude,
                    formattedLocations[0].longitude
                ]);
            }
        } catch (error) {
            console.error('Erro ao carregar localizações:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const loadTeamPath = async (teamId: string) => {
        try {
            const { data, error } = await supabase
                .from('gps_locations')
                .select('latitude, longitude, timestamp')
                .eq('team_id', teamId)
                .eq('stage_id', selectedStage)
                .order('timestamp', { ascending: true });

            if (error) throw error;

            const path: [number, number][] = data.map((loc: any) => [
                parseFloat(loc.latitude),
                parseFloat(loc.longitude)
            ]);

            setTeamPath(path);
            setSelectedTeam(teamId);
        } catch (error) {
            console.error('Erro ao carregar trajeto:', error);
        }
    };

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const formatTimestamp = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'agora';
        if (diffMins === 1) return '1 minuto atrás';
        if (diffMins < 60) return `${diffMins} minutos atrás`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return '1 hora atrás';
        return `${diffHours} horas atrás`;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    if (circuits.length === 0) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900">Localização GPS</h1>
                    <Card className="p-12 text-center">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">Nenhum circuito cadastrado</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Crie um circuito primeiro para habilitar GPS
                        </p>
                    </Card>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Localização GPS</h1>
                        <p className="text-gray-600 mt-1">Rastreamento em tempo real das equipes</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={loadLocations}
                        disabled={refreshing || !selectedStage}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>

                {/* Filtros */}
                <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Circuito:</label>
                            <select
                                value={selectedCircuit}
                                onChange={(e) => {
                                    setSelectedCircuit(e.target.value);
                                    setSelectedTeam(null);
                                    setTeamPath([]);
                                }}
                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Selecione um circuito</option>
                                {circuits.map((circuit) => (
                                    <option key={circuit.id} value={circuit.id}>
                                        {circuit.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Etapa:</label>
                            <select
                                value={selectedStage}
                                onChange={(e) => {
                                    setSelectedStage(e.target.value);
                                    setSelectedTeam(null);
                                    setTeamPath([]);
                                }}
                                className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                disabled={!selectedCircuit}
                            >
                                <option value="">Selecione uma etapa</option>
                                {stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name}
                                        {stage.gpsStartTime && stage.gpsEndTime &&
                                            ` (${stage.gpsStartTime} - ${stage.gpsEndTime})`
                                        }
                                    </option>
                                ))}
                            </select>
                            {selectedCircuit && stages.length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Nenhuma etapa com GPS habilitado neste circuito
                                </p>
                            )}
                        </div>
                    </div>
                </Card>

                {selectedStage && (
                    <>
                        {/* Stats */}
                        <Card className="p-6">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    <div>
                                        <p className="text-sm text-gray-500">Equipes Rastreadas</p>
                                        <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
                                    </div>
                                </div>
                                {locations.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-500">Última Atualização</p>
                                            <p className="text-lg font-semibold text-gray-900">
                                                {formatTimestamp(locations[0].createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Map */}
                        {locations.length > 0 && (
                            <Card className="p-4">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={12}
                                    style={mapContainerStyle}
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {locations.map((location, index) => (
                                        <Marker
                                            key={location.id}
                                            position={[location.latitude, location.longitude]}
                                            icon={createNumberedIcon(index + 1)}
                                            eventHandlers={{
                                                click: () => loadTeamPath(location.teamId)
                                            }}
                                        >
                                            <Popup>
                                                <div className="text-sm">
                                                    <p className="font-bold">{location.teamName}</p>
                                                    <p className="text-gray-600">
                                                        Última atualização: {formatTimestamp(location.createdAt)}
                                                    </p>
                                                    {location.speed && (
                                                        <p className="text-gray-600">
                                                            Velocidade: {location.speed.toFixed(1)} km/h
                                                        </p>
                                                    )}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {teamPath.length > 1 && (
                                        <Polyline
                                            positions={teamPath}
                                            pathOptions={{
                                                color: '#4F46E5',
                                                weight: 3,
                                                opacity: 0.8
                                            }}
                                        />
                                    )}
                                </MapContainer>
                            </Card>
                        )}

                        {/* Teams List */}
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Equipes Habilitadas GPS ({teamsWithGPS.length})
                                </h2>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (confirm('Deseja gerar chaves para quem não tem?')) {
                                            generateMissingGPSKeys();
                                        }
                                    }}
                                >
                                    Gerar Faltantes
                                </Button>
                            </div>
                            {teamsWithGPS.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Nenhuma equipe cadastrada nesta etapa
                                </p>
                            ) : (
                                <div className="grid gap-4">
                                    {teamsWithGPS.map((team) => {
                                        const hasLocation = locations.find(loc => loc.teamId === team.id);
                                        return (
                                            <div
                                                key={team.id}
                                                className={`p-4 border rounded-lg transition-colors ${selectedTeam === team.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : team.gpsAccessKey
                                                        ? 'border-green-300 bg-green-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-gray-900">{team.teamName}</h3>
                                                            {hasLocation && (
                                                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                                                                    ATIVO
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            {team.city} • {team.responsibleName}
                                                        </p>
                                                    </div>
                                                    {hasLocation && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                loadTeamPath(team.id);
                                                                setMapCenter([
                                                                    hasLocation.latitude,
                                                                    hasLocation.longitude
                                                                ]);
                                                            }}
                                                            className="flex-shrink-0"
                                                        >
                                                            <MapPin className="w-4 h-4 mr-1" />
                                                            Ver Trajeto
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="border-t border-gray-200 pt-3">
                                                    {team.gpsAccessKey ? (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-600 mb-2">
                                                                Código GPS para App Mobile:
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-grow bg-white border-2 border-green-400 rounded-lg px-4 py-3 font-mono text-lg font-bold text-green-700 tracking-wider">
                                                                    {team.gpsAccessKey}
                                                                </div>
                                                                <button
                                                                    onClick={() => copyToClipboard(team.gpsAccessKey!)}
                                                                    className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                                                    title="Copiar código"
                                                                >
                                                                    {copiedKey === team.gpsAccessKey ? (
                                                                        <Check className="w-5 h-5" />
                                                                    ) : (
                                                                        <Copy className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                                                            <p className="text-sm text-yellow-800">
                                                                ⚠️ Código GPS não gerado para esta equipe
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
