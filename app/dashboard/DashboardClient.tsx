'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Calendar,
    DollarSign,
    Users,
    FileText,
    Package,
    Wrench,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    ArrowRight,
    MessageCircle,
    LogOut,
    UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mapa de ícones para o cliente renderizar por nome
const IconMap: Record<string, any> = {
    DollarSign,
    TrendingDown,
    Calendar,
    Users,
    CheckCircle,
    Wrench,
    Package,
    FileText
};

interface QuickAccessCard {
    icon: string;
    label: string;
    href: string;
    color: string;
    gradient: string;
}

interface StatCard {
    title: string;
    value: string;
    change: number;
    iconName: string; // Enviamos apenas o nome
    color: string;
}

const quickAccessItems = [
    {
        icon: 'Calendar',
        label: 'Agenda',
        href: '/agenda',
        color: 'from-blue-500 to-blue-600',
        gradient: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20',
    },
    {
        icon: 'DollarSign',
        label: 'Financeiro',
        href: '/financeiro',
        color: 'from-green-500 to-emerald-600',
        gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20',
    },
    {
        icon: 'Users',
        label: 'Clientes',
        href: '/clientes',
        color: 'from-purple-500 to-purple-600',
        gradient: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20',
    },
    {
        icon: 'FileText',
        label: 'Orçamentos',
        href: '/orcamentos',
        color: 'from-orange-500 to-orange-600',
        gradient: 'bg-gradient-to-br from-orange-500/20 to-orange-600/20',
    },
    {
        icon: 'Package',
        label: 'Estoque',
        href: '/estoque',
        color: 'from-cyan-500 to-cyan-600',
        gradient: 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/20',
    },
    {
        icon: 'Wrench',
        label: 'Serviços',
        href: '/servicos',
        color: 'from-pink-500 to-pink-600',
        gradient: 'bg-gradient-to-br from-pink-500/20 to-pink-600/20',
    },
];

interface DashboardClientProps {
    initialStats: StatCard[];
    initialRecentActivities: any[];
    initialTodaysAppointments: any[];
    initialWhatsappTemplate: string;
}

export default function DashboardClient({
    initialStats,
    initialRecentActivities,
    initialTodaysAppointments,
    initialWhatsappTemplate
}: DashboardClientProps) {
    const [stats] = useState<StatCard[]>(initialStats);
    const [recentActivities] = useState<any[]>(initialRecentActivities);
    const [todaysAppointments] = useState<any[]>(initialTodaysAppointments);
    const [user, setUser] = useState<any>(null);
    const [whatsappTemplate] = useState(initialWhatsappTemplate);

    useEffect(() => {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Erro ao ler dados do usuário');
            }
        }
    }, []);

    const handleWhatsApp = (app: any) => {
        const iphone = app.cliente?.telefone || app.telefone;

        if (!iphone) {
            toast.error('Telefone do cliente não encontrado.');
            return;
        }

        const cleanPhone = iphone.replace(/\D/g, '');
        if (cleanPhone.length < 8) {
            toast.error('Telefone inválido.');
            return;
        }

        const dateObj = new Date(app.dataHora);
        const dataStr = dateObj.toLocaleDateString('pt-BR');
        const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let servicosStr = '';
        if (Array.isArray(app.servicos)) {
            if (app.servicos.length > 0) {
                if (typeof app.servicos[0] === 'string') servicosStr = app.servicos.join(', ');
                else servicosStr = app.servicos.map((s: any) => s.nome || s.servico?.nome).join(', ');
            }
        }

        let msg = whatsappTemplate
            .replace('{cliente}', app.clienteNome || 'Cliente')
            .replace('{data}', dataStr)
            .replace('{hora}', horaStr)
            .replace('{servico}', servicosStr || 'Serviços');

        const link = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
        window.open(link, '_blank');
    };

    return (
        <div className="min-h-screen p-4 lg:p-8 space-y-8 pt-4 lg:pt-8 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-down gap-4">
                <div className="pl-1 lg:pl-0">
                    <h1 className="text-3xl lg:text-4xl font-black text-white mb-1 uppercase tracking-tighter">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Resumo operacional do seu negócio.
                    </p>
                </div>
            </div>

            {/* 1. Acesso Rápido - Square Cards */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-sm font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">Acesso Rápido</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                    {quickAccessItems.map((item, index) => {
                        const Icon = IconMap[item.icon] || Clock;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`
                                    ${item.gradient} aspect-square rounded-[2rem] p-4 lg:p-6 
                                    border border-white/10 shadow-xl
                                    hover:scale-[1.02] hover:border-white/20
                                    active:scale-95
                                    transition-all duration-300 
                                    flex flex-col items-center justify-center gap-3
                                    group cursor-pointer
                                `}
                            >
                                <div className={`p-3 lg:p-4 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
                                    <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                                </div>
                                <span className="text-white font-bold text-xs lg:text-base text-center tracking-tight">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 2. Estatísticas - Square Cards (Matching Style) */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-sm font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">Resultados Gerais</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 lg:gap-4">
                    {stats.map((stat, index) => {
                        const Icon = IconMap[stat.iconName] || DollarSign;
                        return (
                            <div
                                key={index}
                                className="glass-effect aspect-square rounded-[2rem] p-4 lg:p-6 flex flex-col items-center justify-center transition-all hover:bg-white/10 border border-white/5 active:scale-95 shadow-xl"
                            >
                                <div className={`p-3 lg:p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-20 mb-3`}>
                                    <Icon className={`w-6 h-6 lg:w-8 lg:h-8 ${stat.color}`} />
                                </div>
                                <h3 className="text-slate-400 text-[10px] lg:text-sm uppercase font-black mb-1 text-center leading-none px-1 tracking-tighter">
                                    {stat.title}
                                </h3>
                                <p className="text-sm lg:text-2xl font-black text-white truncate text-center">
                                    {stat.value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Recent Activities & Todays Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {/* Recent Activities */}
                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Atividades Recentes</h2>
                        <Link href="/atendimentos" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                            Ver todas
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentActivities.length === 0 ? (
                            <div className="text-slate-500 text-sm text-center py-4">Nenhuma atividade recente</div>
                        ) : (
                            recentActivities.map((activity) => {
                                const Icon = activity.icon === 'CheckCircle' ? CheckCircle : Wrench;
                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <div className={`p-2 rounded-lg ${activity.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium">{activity.message}</p>
                                            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Agendamentos do Dia */}
                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Agendamentos do Dia</h2>
                        <Link href="/agenda" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                            Ver agenda
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {todaysAppointments.length === 0 ? (
                            <div className="text-slate-500 text-sm text-center py-4">Nenhum agendamento para hoje</div>
                        ) : (
                            todaysAppointments.map((app, index) => {
                                const styles = [
                                    { bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300' },
                                    { bg: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-300' },
                                    { bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/20', badge: 'bg-green-500/20 text-green-300' }
                                ];
                                const style = styles[index % styles.length];

                                return (
                                    <div key={app.id} className={`p-4 rounded-xl bg-gradient-to-r ${style.bg} border ${style.border}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-white font-semibold">{app.clienteNome}</span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(app.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleWhatsApp(app)}
                                                className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all shadow-lg shadow-green-500/10 active:scale-95"
                                                title="Confirmar no WhatsApp"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-400 text-sm mt-2">
                                            <span className="truncate max-w-[200px]">
                                                {app.servicoPrincipal}
                                            </span>
                                            <span className="text-xs uppercase font-bold tracking-wider opacity-70 border border-white/10 px-1.5 rounded">
                                                {String(app.status).replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
