'use client';

import { usePathname } from 'next/navigation';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import MobileHeader from '@/lib/presentation/components/MobileHeader';
import PWAInstallPrompt from '@/lib/presentation/components/PWAInstallPrompt';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/';

    if (isLoginPage) {
        return (
            <>
                {children}
                <PWAInstallPrompt />
                <Toaster position="top-center" />
            </>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />
            <div className="flex-1 lg:ml-72 transition-all">
                <MobileHeader />
                <main>
                    {children}
                </main>
            </div>
            <PWAInstallPrompt />
            <Toaster position="top-center" />
        </div>
    );
}
