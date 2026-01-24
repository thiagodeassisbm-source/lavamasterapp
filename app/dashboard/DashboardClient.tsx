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
    MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickAccessCard {
    icon: React.ElementType;
    label: string;
    href: string;
    color: string;
    gradient: string;
}

interface StatCard {
    title: string;
    value: string;
    change: number;
    icon: React.ElementType;
    color: string;
}

const quickAccessItems: QuickAccessCard[] = [
    {
        icon: Calendar,
        label: 'Agenda',
        href: '/agenda',
        color: 'from-blue-500 to-blue-600',
        gradient: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20',
    },
    {
        icon: DollarSign,
        label: 'Financeiro',
        href: '/financeiro',
        color: 'from-green-500 to-emerald-600',
        gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20',
    },
    {
        icon: Users,
        label: 'Clientes',
        href: '/clientes',
        color: 'from-purple-500 to-purple-600',
        gradient: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20',
    },
    {
        icon: FileText,
        label: 'Orçamentos',
        href: '/orcamentos',
        color: 'from-orange-500 to-orange-600',
        gradient: 'bg-gradient-to-br from-orange-500/20 to-orange-600/20',
    },
    {
        icon: Package,
        label: 'Estoque',
        href: '/estoque',
        color: 'from-cyan-500 to-cyan-600',
        gradient: 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/20',
    },
    {
        icon: Wrench,
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
    const [stats, setStats] = useState<StatCard[]>(initialStats);
    const [recentActivities, setRecentActivities] = useState<any[]>(initialRecentActivities);
    const [todaysAppointments, setTodaysAppointments] = useState<any[]>(initialTodaysAppointments);
    const [user, setUser] = useState<any>(null);
    const [whatsappTemplate, setWhatsappTemplate] = useState(initialWhatsappTemplate);

    useEffect(() => {
        // Carrega usuário do localStorage
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Se quisermos manter atualizado, poderíamos fazer um fetch aqui também, 
        // mas o foco é o carregamento inicial instantâneo.
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

    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="min-h-screen p-4 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-down gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                        Dashboard
                    </h1>
                    <p className="text-slate-400">
                        Bem-vindo de volta! Aqui está um resumo do seu negócio.
                    </p>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 transition-all outline-none"
                    >
                        <Users className="w-6 h-6" />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 top-14 w-60 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-3 border-b border-white/5 mb-2">
                                <p className="text-white font-semibold">{user?.nome || 'Usuário'}</p>
                                <p className="text-xs text-slate-400">{user?.email || 'email@sistema.com'}</p>
                            </div>

                            <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                                <Users className="w-4 h-4" />
                                <span>Meu Perfil</span>
                            </Link>

                            <button
                                onClick={() => {
                                    localStorage.removeItem('token');
                                    localStorage.removeItem('user_data');
                                    window.location.href = '/login';
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1"
                            >
                                <div className="w-4 h-4" />
                                <span>Sair do Sistema</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const isPositive = stat.change > 0;

                    return (
                        <div
                            key={index}
                            className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                {stat.change !== 0 && (
                                    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        <span className="font-semibold">{Math.abs(stat.change)}%</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-slate-400 text-sm mb-1">{stat.title}</h3>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Access */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-2xl font-bold text-white mb-4">Acesso Rápido</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {quickAccessItems.map((item, index) => {
                        const Icon = item.icon;

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`
                  ${item.gradient} rounded-2xl p-6 
                  border border-white/10
                  hover:scale-105 hover:border-white/20
                  transition-all duration-300 
                  flex flex-col items-center justify-center gap-3
                  group cursor-pointer
                `}
                            >
                                <div className={`p-4 rounded-xl bg-gradient-to-br ${item.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                                <span className="text-white font-semibold text-center">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activities & Todays Appointments */}
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
                                                {app.status.replace('_', ' ')}
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
