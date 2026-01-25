import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AgendaClient from './AgendaClient';

async function getAgendaData() {
    const auth = await getAuthContext();
    if (!auth || !auth.empresaId) return null;

    try {
        const [agendamentos, empresa] = await Promise.all([
            prisma.agendamento.findMany({
                where: { empresaId: auth.empresaId },
                include: {
                    cliente: true,
                    veiculo: true,
                    servicos: {
                        include: { servico: true }
                    }
                },
                orderBy: { dataHora: 'desc' }
            }),
            prisma.empresa.findUnique({
                where: { id: auth.empresaId },
                select: { mensagemConfirmacaoAgendamento: true }
            })
        ]);

        const formattedAgendamentos = agendamentos.map((item: any) => ({
            id: item.id,
            clienteNome: item.cliente?.nome || 'Cliente',
            clienteId: item.clienteId,
            cliente: {
                id: item.cliente?.id,
                nome: item.cliente?.nome,
                telefone: item.cliente?.telefone
            },
            dataHora: item.dataHora.toISOString(),
            servicos: item.servicos.map((s: any) => s.servico?.nome || 'Serviço'),
            status: item.status as any,
            valorTotal: Number(item.valorTotal || 0),
            veiculo: item.veiculo ? `${item.veiculo.marca} ${item.veiculo.modelo} (${item.veiculo.placa})` : undefined
        }));

        return {
            agendamentos: formattedAgendamentos,
            whatsappTemplate: empresa?.mensagemConfirmacaoAgendamento || "Olá *{cliente}*! Confirmando agendamento para *{data}* às *{hora}* na Estética Automotiva."
        };
    } catch (error) {
        console.error('Erro ao buscar dados da agenda (server):', error);
        return { agendamentos: [], whatsappTemplate: '' };
    }
}

async function AgendaContent() {
    const data = await getAgendaData();
    return (
        <AgendaClient
            initialAgendamentos={data?.agendamentos || []}
            initialWhatsappTemplate={data?.whatsappTemplate || ''}
        />
    );
}

export default async function AgendaPage() {
    const auth = await getAuthContext();
    if (!auth) {
        redirect('/login');
    }

    return (
        <Suspense fallback={
            <div className="p-4 lg:p-8 space-y-8 animate-pulse">
                <div className="flex justify-between items-center mb-12">
                    <div className="h-10 w-32 bg-white/5 rounded-xl"></div>
                    <div className="h-12 w-48 bg-blue-500/20 rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
                    ))}
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-white/5 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        }>
            <AgendaContent />
        </Suspense>
    );
}
