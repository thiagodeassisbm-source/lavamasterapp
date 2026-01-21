export const dynamic = 'force-dynamic';

import MobileMenu from '@/lib/presentation/components/MobileMenu';
import Dashboard from '@/lib/presentation/components/Dashboard';

export default function DashboardPage() {
    return (
        <div className="flex min-h-screen">
            <MobileMenu />
            <main className="flex-1 lg:ml-72">
                <Dashboard />
            </main>
        </div>
    );
}
