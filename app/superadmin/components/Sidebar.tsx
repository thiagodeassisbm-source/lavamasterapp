'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
        router.push('/superadmin');
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/superadmin/dashboard' },
        { name: 'Empresas', icon: Users, path: '/superadmin/empresas' }, // Redireciona pro dashboard por enquanto ou filtra
        { name: 'Planos & Preços', icon: CreditCard, path: '/superadmin/planos' },
        { name: 'Configurações', icon: Settings, path: '/superadmin/configuracoes' },
    ];

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar Container */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-72 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">

                    {/* Brand */}
                    <div className="p-8 pb-4">
                        <div className="flex items-center gap-3 text-white mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
                                <Shield size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-tight">Super Admin</h1>
                                <p className="text-xs text-slate-500 font-medium tracking-wide">MASTER CONTROL</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Principal</p>

                        {menuItems.map((item) => {
                            const isActive = pathname === item.path || (item.path !== '/superadmin/dashboard' && pathname.startsWith(item.path));

                            // Ajuste rápido: Se for 'Empresas', mas estivemos no dashboard, ativa o dashboard
                            const isDashboardActive = item.name === 'Dashboard' && pathname === '/superadmin/dashboard';
                            const isEmpresasActive = item.name === 'Empresas' && pathname.includes('/empresas');

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                        ${isActive || (item.name === 'Dashboard' && pathname === '/superadmin/dashboard')
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                                            : 'hover:bg-slate-800 hover:text-white'}
                                    `}
                                >
                                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                                    <span className="font-medium">{item.name}</span>
                                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User & Logout */}
                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-xl transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sair do Sistema</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
                />
            )}
        </>
    );
}
