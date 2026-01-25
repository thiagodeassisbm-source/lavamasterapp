import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';
import { Users } from 'lucide-react';

async function getDashboardData() {
    const auth = await getAuthContext();
    if (!auth || !auth.empresaId) return null;

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
            empresa
        ] = await Promise.all([
            prisma.agendamento.findMany({
                where: {
                    empresaId: auth.empresaId,
                    status: 'concluido',
                    dataHora: { gte: startOfMonth, lte: endOfMonth }
                },
                select: { valorTotal: true }
            }),
            prisma.despesa.findMany({
                where: {
                    empresaId: auth.empresaId,
                    dataVencimento: { gte: startOfMonth, lte: endOfMonth }
                },
                select: { valor: true }
            }),
            prisma.agendamento.findMany({
                where: {
                    empresaId: auth.empresaId,
                    dataHora: { gte: startOfToday, lte: endOfToday },
                    status: { not: 'cancelado' }
                },
                include: {
                    cliente: true,
                    servicos: { include: { servico: true } }
                },
                orderBy: { dataHora: 'asc' }
            }),
            prisma.cliente.count({
                where: { empresaId: auth.empresaId }
            }),
            prisma.agendamento.findMany({
                where: { empresaId: auth.empresaId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: { cliente: true }
            }),
            prisma.empresa.findUnique({
                where: { id: auth.empresaId },
                select: { mensagemConfirmacaoAgendamento: true }
            })
        ]);

        const receitaMensal = atendimentosMes.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
        const valorDespesas = despesasMes.reduce((acc, curr) => acc + (curr.valor || 0), 0);

        const stats = [
            { title: 'Receita do Mês', value: `R$ ${receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 0, iconName: 'DollarSign', color: 'text-green-400' },
            { title: 'Despesas do Mês', value: `R$ ${valorDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: 0, iconName: 'TrendingDown', color: 'text-red-400' },
            { title: 'Agendamentos Hoje', value: atendimentosHoje.length.toString(), change: 0, iconName: 'Calendar', color: 'text-blue-400' },
            { title: 'Clientes Cadastrados', value: totalClientes.toString(), change: 0, iconName: 'Users', color: 'text-purple-400' },
        ];

        const formattedActivities = atividadesRecentes.map(a => ({
            id: a.id,
            type: a.status === 'concluido' ? 'success' : 'info',
            message: `${a.status === 'concluido' ? 'Serviço concluído' : 'Novo serviço iniciado'} - ${a.cliente?.nome || 'Cliente'}`,
            time: new Date(a.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            icon: a.status === 'concluido' ? 'CheckCircle' : 'Wrench'
        }));

        const formattedTodaysAppointments = atendimentosHoje.map(a => ({
            id: a.id,
            clienteNome: a.cliente?.nome || 'Cliente',
            telefone: a.cliente?.telefone || '',
            dataHora: a.dataHora.toISOString(),
            status: a.status,
            servicoPrincipal: a.servicos && a.servicos.length > 0
                ? (a.servicos[0].servico?.nome || 'Serviço')
                : 'Serviço',
            servicosCount: a.servicos?.length || 0
        }));

        return {
            stats,
            recentActivities: formattedActivities,
            todaysAppointments: formattedTodaysAppointments,
            whatsappTemplate: empresa?.mensagemConfirmacaoAgendamento || "Olá *{cliente}*! Confirmando agendamento para *{data}* às *{hora}* na Estética Automotiva."
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
        return (
            <div className="p-4 lg:p-8">
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <Users className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-20" />
                    <h2 className="text-xl font-semibold mb-2">Bem-vindo ao Lavamaster</h2>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Estamos preparando seu painel. Se esta mensagem persistir, verifique sua conexão ou tente fazer login novamente.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="p-8 text-white">Carregando painel...</div>}>
            <DashboardClient
                initialStats={data.stats}
                initialRecentActivities={data.recentActivities}
                initialTodaysAppointments={data.todaysAppointments}
                initialWhatsappTemplate={data.whatsappTemplate}
            />
        </Suspense>
    );
}
