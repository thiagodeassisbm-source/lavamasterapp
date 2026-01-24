import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import FinanceiroClient from './FinanceiroClient';

async function getFinanceiroData() {
    const auth = await getAuthContext();
    if (!auth) return null;

    try {
        const [atendimentos, despesas] = await Promise.all([
            prisma.agendamento.findMany({
                where: {
                    empresaId: auth.empresaId,
                    status: 'concluido'
                },
                include: { cliente: true },
                orderBy: { dataAgendamento: 'desc' }
            }),
            prisma.despesa.findMany({
                where: { empresaId: auth.empresaId },
                orderBy: { data: 'desc' }
            })
        ]);

        const formattedReceitas = atendimentos.map(a => ({
            id: a.id,
            descricao: `Serviço - ${a.cliente.nome}`,
            cliente: a.cliente.nome,
            valor: a.valorTotal,
            data: a.dataAgendamento.toISOString().split('T')[0],
            tipo: 'receita'
        }));

        const formattedDespesas = despesas.map(d => ({
            id: d.id,
            descricao: d.descricao,
            valor: d.valor,
            categoria: d.categoria,
            data: d.data.toISOString().split('T')[0],
            formaPagamento: d.formaPagamento,
            tipo: 'despesa'
        }));

        return {
            receitas: formattedReceitas,
            despesas: formattedDespesas
        };
    } catch (error) {
        console.error('Erro ao buscar dados do financeiro (server):', error);
        return { receitas: [], despesas: [] };
    }
}

export default async function FinanceiroPage() {
    const auth = await getAuthContext();
    if (!auth) {
        redirect('/login');
    }

    const data = await getFinanceiroData();

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium">Carregando financeiro...</p>
                </div>
            </div>
        }>
            <FinanceiroClient
                initialReceitas={JSON.parse(JSON.stringify(data?.receitas || []))}
                initialDespesas={JSON.parse(JSON.stringify(data?.despesas || []))}
            />
        </Suspense>
    );
}
