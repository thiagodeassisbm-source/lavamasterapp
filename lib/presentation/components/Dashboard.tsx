'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LogoLM from './LogoLM';
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
    Menu
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

export default function Dashboard() {
    const [stats, setStats] = useState<StatCard[]>([
        { title: 'Receita do Mês', value: 'R$ 0,00', change: 0, icon: DollarSign, color: 'text-green-400' },
        { title: 'Agendamentos Hoje', value: '0', change: 0, icon: Calendar, color: 'text-blue-400' },
        { title: 'Clientes Ativos', value: '0', change: 0, icon: Users, color: 'text-purple-400' },
        { title: 'Serviços em Andamento', value: '0', change: 0, icon: Clock, color: 'text-orange-400' },
    ]);

    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [todaysAppointments, setTodaysAppointments] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [whatsappTemplate, setWhatsappTemplate] = useState('');

    useEffect(() => {
        // Carrega usuário do localStorage
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Carrega template de mensagem
        fetch('/api/configuracoes/mensagens')
            .then(res => res.json())
            .then(data => {
                if (data.message) setWhatsappTemplate(data.message);
                else setWhatsappTemplate("Olá *{cliente}*! Confirmando agendamento para *{data}* às *{hora}* na Estética Automotiva.");
            })
            .catch(err => console.error("Erro ao carregar template:", err));

        const fetchData = async () => {
            try {
                const [resAtendimentos, resClientes, resDespesas, resOrcamentos] = await Promise.all([
                    fetch('/api/agendamentos'),
                    fetch('/api/clientes'),
                    fetch('/api/despesas'),
                    fetch('/api/orcamentos')
                ]);

                if (resAtendimentos.ok && resClientes.ok && resDespesas.ok && resOrcamentos.ok) {
                    const atendimentos = await resAtendimentos.json();
                    const clientes = await resClientes.json();
                    const despesas = await resDespesas.json();
                    const orcamentos = await resOrcamentos.json();

                    // --- CALCULAR ESTATÍSTICAS ---
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    const receitaMensal = atendimentos
                        .filter((a: any) => {
                            const data = new Date(a.dataHora);
                            return data.getMonth() === currentMonth &&
                                data.getFullYear() === currentYear &&
                                a.status === 'concluido';
                        })
                        .reduce((acc: number, curr: any) => acc + (curr.valorTotal || 0), 0);

                    const despesasMensais = despesas
                        .filter((d: any) => {
                            const data = new Date(d.dataVencimento || d.createdAt || d.data);
                            return data.getMonth() === currentMonth &&
                                data.getFullYear() === currentYear;
                        })
                        .reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);

                    // 2. Agendamentos Hoje (Verificação por data dia/mes/ano)
                    const isToday = (dateString: string) => {
                        const d = new Date(dateString);
                        const n = new Date();
                        return d.getDate() === n.getDate() &&
                            d.getMonth() === n.getMonth() &&
                            d.getFullYear() === n.getFullYear();
                    };

                    const agendamentosHojeList = atendimentos.filter((a: any) => isToday(a.dataHora));
                    const agendamentosHojeCount = agendamentosHojeList.length;

                    // 3. Clientes Ativos
                    const clientesAtivos = clientes.length;

                    setStats([
                        { title: 'Receita do Mês', value: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 0, icon: DollarSign, color: 'text-green-400' },
                        { title: 'Despesas do Mês', value: `R$ ${despesasMensais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 0, icon: TrendingDown, color: 'text-red-400' },
                        { title: 'Agendamentos Hoje', value: agendamentosHojeCount.toString(), change: 0, icon: Calendar, color: 'text-blue-400' },
                        { title: 'Clientes Cadastrados', value: clientesAtivos.toString(), change: 0, icon: Users, color: 'text-purple-400' },
                    ]);


                    // --- ATIVIDADES RECENTES (Agendamentos + Orçamentos) ---
                    const atividadesAgendamentos = atendimentos.map((a: any) => ({
                        id: a.id,
                        date: new Date(a.updatedAt || a.createdAt),
                        type: a.status === 'concluido' ? 'success' : 'info',
                        message: a.status === 'concluido' ? `Serviço concluído - ${a.clienteNome}` :
                            a.status === 'em_andamento' ? `Atendimento iniciado - ${a.clienteNome}` :
                                `Agendamento realizado - ${a.clienteNome}`,
                        time: new Date(a.updatedAt || a.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        icon: a.status === 'concluido' ? CheckCircle : (a.status === 'em_andamento' ? Wrench : Calendar)
                    }));

                    const atividadesOrcamentos = orcamentos.map((o: any) => ({
                        id: o.id,
                        date: new Date(o.updatedAt || o.createdAt),
                        type: 'warning',
                        message: `Orcamento criado - ${o.cliente?.nome || 'Cliente'}`,
                        time: new Date(o.updatedAt || o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        icon: FileText
                    }));

                    const sortedActivities = [...atividadesAgendamentos, ...atividadesOrcamentos]
                        .sort((a, b) => b.date.getTime() - a.date.getTime())
                        .slice(0, 5);

                    setRecentActivities(sortedActivities);


                    // --- AGENDAMENTOS DO DIA ---
                    const doDia = agendamentosHojeList
                        .filter((a: any) => (a.status !== 'cancelado'))
                        .sort((a: any, b: any) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

                    setTodaysAppointments(doDia);
                }
            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            }
        };

        fetchData();
    }, []);

    const handleWhatsApp = (app: any) => {
        // Tenta pegar telefone do objeto cliente (vinda do include na API) ou direto se existir
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

    // --- User Dropdown Logic ---
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <div className="min-h-screen p-4 lg:p-8 space-y-8 pt-4 lg:pt-8 pb-24 lg:pb-8">
            {/* Main Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-down gap-4">
                <div className="pl-1 lg:pl-0">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 uppercase tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Bem-vindo de volta! Aqui está um resumo do seu negócio.
                    </p>
                </div>

                {/* User Profile */}
                <div className="relative hidden lg:block">
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

                            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1">
                                <LogOut className="w-4 h-4" />
                                <span>Sair do Sistema</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 1. Acesso Rápido - Square Cards */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-widest text-slate-400">Acesso Rápido</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                    {quickAccessItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`
                                    ${item.gradient} aspect-square rounded-3xl p-4 lg:p-6 
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
                                <span className="text-white font-bold text-xs lg:text-base text-center">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* 2. Estatísticas - Square Cards (Matching Acesso Rápido) */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-widest text-slate-400">Resultados</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 lg:gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="glass-effect aspect-square rounded-3xl p-4 lg:p-6 flex flex-col items-center justify-center transition-all hover:bg-white/10 border border-white/5 active:scale-95"
                            >
                                <div className={`p-3 lg:p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-20 mb-3`}>
                                    <Icon className={`w-6 h-6 lg:w-8 lg:h-8 ${stat.color}`} />
                                </div>
                                <h3 className="text-slate-400 text-[10px] lg:text-sm uppercase font-black mb-1 text-center leading-none px-1">
                                    {stat.title}
                                </h3>
                                <p className="text-base lg:text-2xl font-black text-white truncate text-center">
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
                        <Link href="/atividades" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                            Ver todas
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentActivities.length === 0 ? (
                            <div className="text-slate-500 text-sm text-center py-4">Nenhuma atividade recente</div>
                        ) : (
                            recentActivities.map((activity) => {
                                const Icon = activity.icon || CheckCircle;
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
                                // Rotate colors
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

                                            {/* ACTION BUTTON */}
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
                                                {(Array.isArray(app.servicos) && app.servicos.length > 0)
                                                    ? (typeof app.servicos[0] === 'string' ? app.servicos[0] : (app.servicos[0].nome || app.servicos[0].servico?.nome))
                                                    : 'Serviço'
                                                }
                                                {(Array.isArray(app.servicos) && app.servicos.length > 1) && ` + ${app.servicos.length - 1}`}
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
