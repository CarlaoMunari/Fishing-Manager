import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 lg:ml-0">
                <div className="container mx-auto px-4 py-8 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
