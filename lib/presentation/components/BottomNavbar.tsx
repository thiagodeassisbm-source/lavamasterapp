'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PlayCircle,
    Calendar,
    ClipboardList,
    Users,
    History as HistoryIcon,
    Bot,
    DollarSign,
    Package,
    Wrench,
    FileText,
    Settings
} from 'lucide-react';

const navItems = [
    { icon: LayoutDashboard, label: 'Início', href: '/dashboard' },
    { icon: PlayCircle, label: 'Iniciar', href: '/novo-atendimento' },
    {
        icon: Calendar,
        label: 'Agenda',
        subItems: [
            { label: 'Calendário', href: '/agenda' },
            { label: 'Mensagens', href: '/agenda/mensagens' }
        ]
    },
    { icon: ClipboardList, label: 'Atendimentos', href: '/atendimentos' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: HistoryIcon, label: 'Recall', href: '/recall' },
    { icon: Bot, label: 'IA', href: '/automacao' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: Package, label: 'Estoque', href: '/estoque' },
    { icon: Wrench, label: 'Serviços', href: '/servicos' },
    { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
    {
        icon: Settings,
        label: 'Ajustes',
        subItems: [
            { label: 'Empresa', href: '/configuracoes/empresa' },
            { label: 'Usuários', href: '/configuracoes/usuarios/novo' },
            { label: 'Instalar App', href: '/configuracoes/download' }
        ]
    },
];

export default function BottomNavbar() {
    const pathname = usePathname();
    const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);

    // Don't show on login page
    if (pathname === '/') return null;

    const toggleSubmenu = (label: string) => {
        if (activeSubmenu === label) {
            setActiveSubmenu(null);
        } else {
            setActiveSubmenu(label);
        }
    };

    return (
        <>
            {/* Submenu Overlay/Drawer */}
            {activeSubmenu && (
                <div className="fixed inset-0 z-[90] lg:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveSubmenu(null)} />
                    <div className="absolute bottom-[72px] left-4 right-4 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 animate-slide-up shadow-2xl">
                        {navItems.find(i => i.label === activeSubmenu)?.subItems?.map((sub) => (
                            <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setActiveSubmenu(null)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === sub.href ? 'bg-blue-500/10 text-blue-400 font-bold' : 'text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <span className="text-sm">{sub.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-2 pb-safe-area-inset-bottom">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 px-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const hasSubItems = !!item.subItems;
                        const isActive = item.href ? pathname === item.href : item.subItems?.some(s => s.href === pathname);

                        if (hasSubItems) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => toggleSubmenu(item.label)}
                                    className={`flex flex-col items-center justify-center min-w-[72px] py-1 px-2 rounded-xl transition-all ${isActive
                                        ? 'text-blue-400 bg-blue-500/10'
                                        : 'text-slate-500'
                                        }`}
                                >
                                    <Icon className={`w-6 h-6 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                                    <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href || '#'}
                                className={`flex flex-col items-center justify-center min-w-[72px] py-1 px-2 rounded-xl transition-all ${isActive
                                    ? 'text-blue-400 bg-blue-500/10'
                                    : 'text-slate-500'
                                    }`}
                            >
                                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
                                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
