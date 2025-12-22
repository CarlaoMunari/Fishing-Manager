import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useTheme() {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser?.id) {
            loadTheme(currentUser.id);
        } else {
            // Reset para cor padrão se não houver usuário logado
            resetTheme();
        }
    }, [currentUser]);

    const loadTheme = (userId: string) => {
        const savedSettings = localStorage.getItem(`company_settings_${userId}`);
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            const primaryColor = parsed.primaryColor || '#2563eb';

            // Aplicar cor primária como CSS variable
            document.documentElement.style.setProperty('--primary-color', primaryColor);

            // Gerar variações da cor primária
            const rgb = hexToRgb(primaryColor);
            if (rgb) {
                document.documentElement.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
        } else {
            resetTheme();
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
}
