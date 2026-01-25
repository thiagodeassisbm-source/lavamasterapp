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

export default async function AgendaPage() {
    const auth = await getAuthContext();
    if (!auth) {
        redirect('/login');
    }

    const data = await getAgendaData();

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium">Carregando agenda...</p>
                </div>
            </div>
        }>
            <AgendaClient
                initialAgendamentos={data?.agendamentos || []}
                initialWhatsappTemplate={data?.whatsappTemplate || ''}
            />
        </Suspense>
    );
}
