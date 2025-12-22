import { useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const location = useLocation();

    useEffect(() => {
        loadThemeFromUrl();
    }, [location.pathname]);

    const loadThemeFromUrl = async () => {
        // Extrair companyName da URL (formato: /:companyName ou /:companyName/...)
        const pathParts = location.pathname.split('/').filter(Boolean);

        // Se não tiver slug ou for rota de admin/login, usar cor padrão
        if (pathParts.length === 0 ||
            pathParts[0] === 'admin' ||
            pathParts[0] === 'login' ||
            pathParts[0] === 'ranking' ||
            pathParts[0] === 'etapas' ||
            pathParts[0] === 'regulamento') {
            resetTheme();
            return;
        }

        const companySlug = pathParts[0];

        try {
            // Buscar empresa pelo slug
            const { data: company } = await supabase
                .from('users')
                .select('id')
                .eq('slug', companySlug)
                .eq('role', 'company')
                .single();

            if (company) {
                // Buscar configurações da empresa do Supabase
                const { data: settings } = await supabase
                    .from('company_settings')
                    .select('primary_color')
                    .eq('company_id', company.id)
                    .single();

                if (settings && settings.primary_color) {
                    applyTheme(settings.primary_color);
                } else {
                    resetTheme();
                }
            } else {
                resetTheme();
            }
        } catch (error) {
            console.error('Erro ao carregar tema:', error);
            resetTheme();
        }
    };

    const applyTheme = (primaryColor: string) => {
        document.documentElement.style.setProperty('--primary-color', primaryColor);

        const rgb = hexToRgb(primaryColor);
        if (rgb) {
            document.documentElement.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
    };

    const resetTheme = () => {
        // Cor padrão blue-600
        document.documentElement.style.setProperty('--primary-color', '#2563eb');
        document.documentElement.style.setProperty('--primary-rgb', '37, 99, 235');
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    return <>{children}</>;
}
