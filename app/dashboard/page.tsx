import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import DashboardClient from './DashboardClient';
import {
    DollarSign,
    Calendar,
    Users,
    TrendingDown
} from 'lucide-react';

async function getDashboardData() {
    const auth = await getAuthContext();
    if (!auth) return null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    try {
        const [
            atendimentosMes,
            despesasMes,
            atendimentosHoje,
            totalClientes,
            atividadesRecentes,
            configMsg
        ] = await Promise.all([
            // Receita do Mês
            prisma.agendamento.findMany({
                where: {
                    empresaId: auth.empresaId,
                    status: 'concluido',
                    dataAgendamento: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                },
                select: { valorTotal: true }
            }),
            // Despesas do Mês
            prisma.despesa.findMany({
                where: {
                    empresaId: auth.empresaId,
                    data: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                },
                select: { valor: true }
            }),
            // Agendamentos Hoje
            prisma.agendamento.findMany({
                where: {
                    empresaId: auth.empresaId,
                    dataAgendamento: {
                        gte: startOfToday,
                        lte: endOfToday
                    },
                    status: { not: 'cancelado' }
                },
                include: {
                    cliente: true,
                    servicos: {
                        include: { servico: true }
                    }
                },
                orderBy: { dataAgendamento: 'asc' }
            }),
            // Total Clientes
            prisma.cliente.count({
                where: { empresaId: auth.empresaId }
            }),
            // Atividades Recentes
            prisma.agendamento.findMany({
                where: { empresaId: auth.empresaId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: { cliente: true }
            }),
            // WhatsApp Template
            prisma.configuracao.findFirst({
                where: {
                    empresaId: auth.empresaId,
                    chave: 'whatsapp_template'
                }
            })
        ]);

        const receitaMensal = atendimentosMes.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
        const valorDespesas = despesasMes.reduce((acc, curr) => acc + (curr.valor || 0), 0);

        const stats = [
            { title: 'Receita do Mês', value: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 0, icon: DollarSign, color: 'text-green-400' },
            { title: 'Despesas do Mês', value: `R$ ${valorDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 0, icon: TrendingDown, color: 'text-red-400' },
            { title: 'Agendamentos Hoje', value: atendimentosHoje.length.toString(), change: 0, icon: Calendar, color: 'text-blue-400' },
            { title: 'Clientes Cadastrados', value: totalClientes.toString(), change: 0, icon: Users, color: 'text-purple-400' },
        ];

        const formattedActivities = atividadesRecentes.map(a => ({
            id: a.id,
            type: a.status === 'concluido' ? 'success' : 'info',
            message: `${a.status === 'concluido' ? 'Serviço concluído' : 'Novo serviço iniciado'} - ${a.cliente.nome}`,
            time: new Date(a.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon: a.status === 'concluido' ? 'CheckCircle' : 'Wrench'
        }));

        const formattedTodaysAppointments = atendimentosHoje.map(a => ({
            id: a.id,
            clienteNome: a.cliente.nome,
            telefone: a.cliente.telefone,
            dataHora: a.dataAgendamento.toISOString(),
            status: a.status,
            servicoPrincipal: a.servicos.length > 0
                ? (a.servicos[0].servico?.nome || 'Serviço')
                : 'Serviço',
            servicosCount: a.servicos.length
        }));

        return {
            stats,
            recentActivities: formattedActivities,
            todaysAppointments: formattedTodaysAppointments,
            whatsappTemplate: configMsg?.valor || "Olá *{cliente}*! Confirmando agendamento para *{data}* às *{hora}* na Estética Automotiva."
        };
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard (server):', error);
        return null;
    }
}

export default async function DashboardPage() {
    const auth = await getAuthContext();
    if (!auth) {
        redirect('/login');
    }

    const data = await getDashboardData();
    if (!data) {
        // Se der erro, poderíamos redirecionar ou mostrar erro, mas vamos tentar carregar vazio
        return (
            <div className="flex min-h-screen bg-slate-950">
                <MobileMenu />
                <main className="flex-1 lg:ml-72 flex items-center justify-center">
                    <p className="text-red-400">Erro ao carregar dados do sistema.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />
            <main className="flex-1 lg:ml-72">
                <Suspense fallback={
                    <div className="p-8 space-y-8 animate-pulse">
                        <div className="h-20 bg-white/5 rounded-2xl w-1/3"></div>
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>)}
                        </div>
                        <div className="grid grid-cols-6 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl"></div>)}
                        </div>
                    </div>
                }>
                    <DashboardClient
                        initialStats={JSON.parse(JSON.stringify(data.stats))}
                        initialRecentActivities={JSON.parse(JSON.stringify(data.recentActivities))}
                        initialTodaysAppointments={JSON.parse(JSON.stringify(data.todaysAppointments))}
                        initialWhatsappTemplate={data.whatsappTemplate}
                    />
                </Suspense>
            </main>
        </div>
    );
}
