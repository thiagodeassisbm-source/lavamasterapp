import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AtendimentosClient from './AtendimentosClient';

async function getAtendimentos() {
    const auth = await getAuthContext();
    if (!auth || !auth.empresaId) return null;

    try {
        const data = await prisma.agendamento.findMany({
            where: { empresaId: auth.empresaId },
            include: {
                cliente: true,
                veiculo: true,
                servicos: {
                    include: {
                        servico: true
                    }
                }
            },
            orderBy: { dataHora: 'desc' }
        });

        // Formatar os dados para o formato que o componente espera
        return data.map((item: any) => ({
            id: item.id,
            clienteNome: item.cliente?.nome || 'Cliente',
            clienteId: item.clienteId,
            veiculo: item.veiculo ? `${item.veiculo.marca} ${item.veiculo.modelo} (${item.veiculo.placa})` : 'Sem veículo',
            servicos: item.servicos.map((s: any) => s.servico?.nome || 'Serviço'),
            valorTotal: Number(item.valorTotal || 0),
            status: item.status as any,
            dataHora: item.dataHora.toISOString(),
            formaPagamento: item.formaPagamento || 'Não informada'
        }));
    } catch (error) {
        console.error('Erro ao buscar atendimentos (server):', error);
        return [];
    }
}

export default async function AtendimentosPage() {
    const auth = await getAuthContext();
    if (!auth) {
        redirect('/login');
    }

    const initialAtendimentos = await getAtendimentos();

    if (initialAtendimentos === null) {
        redirect('/login');
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium">Carregando atendimentos...</p>
                </div>
            </div>
        }>
            <AtendimentosClient initialAtendimentos={initialAtendimentos} />
        </Suspense>
    );
}
