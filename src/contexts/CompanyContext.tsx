import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface CompanyContextType {
    companyId: string | null;
    isSuperAdmin: boolean;
    isCompanyUser: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function useCompany() {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within CompanyProvider');
    }
    return context;
}

interface CompanyProviderProps {
    children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
    const { currentUser } = useAuth();

    const value: CompanyContextType = {
        // Se for super_admin, companyId é null (vê tudo)
        // Se for company, companyId é o próprio ID
        companyId: currentUser?.role === 'company' ? currentUser.id : null,
        isSuperAdmin: currentUser?.role === 'super_admin',
        isCompanyUser: currentUser?.role === 'company',
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
}
