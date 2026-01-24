import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NovoAtendimentoClient from './NovoAtendimentoClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function getData(atendimentoId?: string) {
    const ctx = await getAuthContext();
    if (!ctx || !ctx.empresaId) return null;

    const [clientes, servicos] = await Promise.all([
        prisma.cliente.findMany({
            where: { empresaId: ctx.empresaId, ativo: true },
            include: { veiculos: true },
            orderBy: { nome: 'asc' }
        }),
        prisma.servico.findMany({
            where: { empresaId: ctx.empresaId, ativo: true },
            orderBy: { nome: 'asc' }
        })
    ]);

    let atendimento = null;
    if (atendimentoId) {
        const found = await prisma.agendamento.findUnique({
            where: { id: atendimentoId, empresaId: ctx.empresaId },
            include: {
                servicos: { include: { servico: true } }
            }
        });

        if (found) {
            // Formata para o formato que o client espera
            const formattedAtendimento = {
                ...found,
                servicos: found.servicos.map(s => ({
                    id: s.servicoId,
                    nome: s.servico?.nome,
                    preco: Number(s.valorUnitario)
                }))
            };
            atendimento = JSON.parse(JSON.stringify(formattedAtendimento));
        }
    }

    return {
        clientes: JSON.parse(JSON.stringify(clientes)),
        servicos: JSON.parse(JSON.stringify(servicos)),
        atendimento
    };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    // searchParams é um Promise no Next.js 15
    const params = await searchParams;
    const id = params?.id;

    const data = await getData(id);

    if (!data) redirect('/login');

    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando formulário...</div>}>
            <NovoAtendimentoClient
                initialClientes={data.clientes}
                initialServicos={data.servicos}
                initialAtendimento={data.atendimento}
            />
        </Suspense>
    );
}
