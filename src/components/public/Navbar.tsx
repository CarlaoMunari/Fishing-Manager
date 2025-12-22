import { Link, useNavigate, useParams } from 'react-router-dom';
import { Fish, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [circuitMenuOpen, setCircuitMenuOpen] = useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { companyName } = useParams();

    // Company settings
    const [companyLogo, setCompanyLogo] = useState<string | null>(null);
    const [companyTitle, setCompanyTitle] = useState<string | null>(null);

    // Load company settings for all visitors
    useEffect(() => {
        // Try to load default settings (super_admin settings for localhost:3000)
        const defaultSettings = localStorage.getItem('default_company_settings');
        if (defaultSettings) {
            const parsed = JSON.parse(defaultSettings);
            setCompanyLogo(parsed.logoUrl || null);
            setCompanyTitle(parsed.title || null);
        }

        // TODO: For custom domains like /:companyName, load company-specific settings
        // based on the URL slug
    }, []);

    // Base path para links (com ou sem company slug)
    const basePath = companyName ? `/${companyName}` : '';

    // Links para o menu mobile (simplificado)
    const mobileLinks = [
        { name: 'Início', path: basePath || '/' },
        { name: 'Etapas', path: `${basePath}/etapas` },
        { name: 'Classificação', path: `${basePath}/ranking` },
        { name: 'Regulamento', path: `${basePath}/regulamento` },
        { name: 'Contato', path: `${basePath}/#contato` },
    ];

    return (
        <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
                        {companyLogo ? (
                            <img src={companyLogo} alt="Logo" className="h-12 w-12 object-contain" />
                        ) : (
                            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
                                <Fish className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-xl font-bold leading-none tracking-tight">
                                {companyTitle || 'CIRCUITO'}
                            </span>
                            {!companyTitle && (
                                <span className="text-sm font-medium text-blue-400 leading-none tracking-widest">PESCA ESPORTIVA</span>
                            )}
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to={basePath || '/'} className="text-sm font-medium text-gray-300 hover:text-white hover:text-blue-400 transition-colors uppercase tracking-wide">
                            Início
                        </Link>

                        {/* Circuitos Dropdown */}
                        <div
                            className="relative group"
                            onMouseEnter={() => setCircuitMenuOpen(true)}
                            onMouseLeave={() => setCircuitMenuOpen(false)}
                        >
                            <button className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white hover:text-blue-400 transition-colors uppercase tracking-wide focus:outline-none">
                                Circuitos
                                <svg className={`w-4 h-4 transition-transform ${circuitMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Content */}
                            <div className={`absolute left-0 mt-0 w-56 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 transition-all duration-200 ${circuitMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                                <Link to={`${basePath}/etapas`} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 border-b border-gray-100">
                                    Etapas
                                </Link>
                                <Link to={`${basePath}/ranking`} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 border-b border-gray-100">
                                    Classificação
                                </Link>
                                <Link to={`${basePath}/regulamento`} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">
                                    Regulamento
                                </Link>
                            </div>
                        </div>

                        <Link to={`${basePath}/#contato`} className="text-sm font-medium text-gray-300 hover:text-white hover:text-blue-400 transition-colors uppercase tracking-wide">
                            Contato
                        </Link>

                        <div className="pl-4 border-l border-slate-700">
                            {currentUser ? (
                                <Button
                                    variant="primary"
                                    className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-900/20"
                                    onClick={() => navigate('/admin')}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Painel Admin
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
                                    onClick={() => navigate('/login')}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Login
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-slate-800 flex flex-col gap-2 animate-in slide-in-from-top-2">
                        {mobileLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="block px-4 py-3 text-gray-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="px-4 pt-4 border-t border-slate-800 mt-2">
                            {currentUser ? (
                                <Button
                                    variant="primary"
                                    className="w-full bg-blue-600"
                                    onClick={() => {
                                        navigate('/admin');
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Painel Admin
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
                                    onClick={() => {
                                        navigate('/login');
                                        setMobileMenuOpen(false);
                                    }}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Login
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
