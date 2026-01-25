'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Calendar,
    DollarSign,
    Users,
    FileText,
    Package,
    Wrench,
    LayoutDashboard,
    Menu,
    X,
    Settings,
    LogOut,
    ChevronRight,
    ChevronDown,
    PlayCircle,
    ClipboardList,
    Bot,
    Download,
    UserPlus,
    Circle,
    MessageSquare,
    History as HistoryIcon,
    Building2
} from 'lucide-react';
import LogoLM from './LogoLM';
import BottomNavbar from './BottomNavbar';

interface MenuItem {
    icon: React.ElementType;
    label: string;
    href?: string;
    badge?: number;
    subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: PlayCircle, label: 'Iniciar Atendimento', href: '/novo-atendimento' },
    {
        icon: Calendar,
        label: 'Agenda',
        subItems: [
            { icon: Calendar, label: 'Calendário', href: '/agenda' },
            { icon: MessageSquare, label: 'Mensagens', href: '/agenda/mensagens' }
        ]
    },
    { icon: ClipboardList, label: 'Atendimentos', href: '/atendimentos' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: HistoryIcon, label: 'Recall', href: '/recall' },
    { icon: Bot, label: 'Automação IA', href: '/automacao' },
    { icon: DollarSign, label: 'Receitas e Despesas', href: '/financeiro' },
    { icon: Package, label: 'Estoque', href: '/estoque' },
    { icon: Wrench, label: 'Serviços', href: '/servicos' },
    { icon: FileText, label: 'Orçamentos', href: '/orcamentos' },
    {
        icon: Settings,
        label: 'Configurações',
        subItems: [
            { icon: Building2, label: 'Empresa', href: '/configuracoes/empresa' },
            { icon: UserPlus, label: 'Usuários', href: '/configuracoes/usuarios/novo' },
            { icon: Download, label: 'Instalar App', href: '/configuracoes/download' }
        ]
    }
];

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            setIsOpen(false);
            toast.success('Você saiu do sistema.');
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/');
        }
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggle-mobile-menu', handleToggle);
        return () => window.removeEventListener('toggle-mobile-menu', handleToggle);
    }, []);

    const toggleSubMenu = (label: string) => {
        setExpandedMenus(prev =>
            prev.includes(label)
                ? prev.filter(p => p !== label)
                : [...prev, label]
        );
    };

    const isActive = (href?: string) => href ? pathname === href : false;
    const isParentActive = (item: MenuItem) => item.subItems?.some(sub => sub.href === pathname);

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={toggleMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 min-h-screen h-full w-72 bg-slate-900/95 backdrop-blur-xl z-50
          transform transition-transform duration-300 ease-in-out
          border-r border-white/10 shadow-2xl
          lg:translate-x-0 lg:fixed lg:inset-y-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <LogoLM size="md" />
                            <div>
                                <h2 className="text-base font-bold text-white leading-tight">Lava Master</h2>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Estética Automotiva</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
                        <div className="space-y-0.5">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                const hasSubItems = !!item.subItems;
                                const expanded = expandedMenus.includes(item.label);
                                const parentActive = isParentActive(item);

                                // Parent Item
                                const Component = hasSubItems ? 'button' : Link;
                                const props: any = hasSubItems
                                    ? { onClick: () => toggleSubMenu(item.label) }
                                    : { href: item.href, onClick: () => setIsOpen(false) };

                                return (
                                    <div key={item.label}>
                                        <Component
                                            {...props}
                                            className={`
                                                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                                                transition-all duration-200 group relative select-none
                                                ${item.href === '/novo-atendimento' ? 'mb-2 mt-1' : ''}
                                                ${active || (hasSubItems && parentActive)
                                                    ? item.href === '/novo-atendimento'
                                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                                                        : 'bg-white/10 text-white font-medium'
                                                    : item.href === '/novo-atendimento'
                                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.01]'
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }
                                            `}
                                        >
                                            <Icon className={`w-4.5 h-4.5 ${active || (hasSubItems && parentActive) ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} ${item.href === '/novo-atendimento' ? '!text-white' : ''}`} />
                                            <span className="text-sm flex-1 text-left">{item.label}</span>

                                            {hasSubItems && (
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180 text-white' : 'text-slate-600'}`} />
                                            )}

                                            {!hasSubItems && active && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                            )}
                                        </Component>

                                        {/* Submenu */}
                                        {hasSubItems && (
                                            <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-64 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                                                <div className="bg-black/20 rounded-lg ml-0 py-1 space-y-0.5">
                                                    {item.subItems!.map(sub => {
                                                        const SubIcon = sub.icon;
                                                        const subActive = isActive(sub.href);
                                                        return (
                                                            <Link
                                                                key={sub.label}
                                                                href={sub.href!}
                                                                onClick={() => setIsOpen(false)}
                                                                className={`
                                                                    flex items-center gap-3 px-3 py-2 pl-10 rounded-md
                                                                    transition-colors text-sm
                                                                    ${subActive ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                                                `}
                                                            >
                                                                {/* <SubIcon className="w-3.5 h-3.5 opacity-70" /> */}
                                                                <span className={`${subActive ? 'font-medium' : ''}`}>{sub.label}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                        >
                            <LogOut className="w-4.5 h-4.5 group-hover:text-red-500" />
                            <span className="text-sm font-medium">Sair do Sistema</span>
                        </button>
                    </div>
                </div>
            </aside>

            <BottomNavbar />
        </>
    );
}
