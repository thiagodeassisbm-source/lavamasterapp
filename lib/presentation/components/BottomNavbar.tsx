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
    { icon: Calendar, label: 'Agenda', href: '/agenda' },
    { icon: ClipboardList, label: 'Atendimentos', href: '/atendimentos' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: HistoryIcon, label: 'Recall', href: '/recall' },
    { icon: Bot, label: 'IA', href: '/automacao' },
    { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
    { icon: Package, label: 'Estoque', href: '/estoque' },
    { icon: Wrench, label: 'Serviços', href: '/servicos' },
    { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
    { icon: Settings, label: 'Ajustes', href: '/configuracoes/empresa' },
];

export default function BottomNavbar() {
    const pathname = usePathname();

    // Don't show on login page
    if (pathname === '/') return null;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-2 pb-safe-area-inset-bottom">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
    );
}
