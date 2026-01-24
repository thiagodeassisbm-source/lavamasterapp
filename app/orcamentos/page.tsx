import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrcamentosClient from './OrcamentosClient';

export default async function OrcamentosPage() {
    const ctx = await getAuthContext();

    if (!ctx) {
        redirect('/');
    }

    // Buscar orçamentos diretamente do banco
    const orcamentos = await prisma.orcamento.findMany({
        where: ctx.role !== 'superadmin' ? { empresaId: ctx.empresaId! } : {},
        orderBy: { createdAt: 'desc' }
    });

    // Converter datas para string para evitar problemas de serialização
    const formattedOrcamentos = orcamentos.map(o => ({
        ...o,
        valor: Number(o.valorFinal || o.valorTotal || 0),
        data: o.dataOrcamento.toISOString(),
        validade: o.validade?.toISOString() || o.dataOrcamento.toISOString(),
        cliente: 'Cliente', // No backend real buscaríamos o nome do cliente
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
    }));

    // Buscar nomes dos clientes para os orçamentos
    const orcamentosWithClients = await Promise.all(formattedOrcamentos.map(async (o) => {
        if (o.clienteId && o.clienteId !== '0') {
            const cliente = await prisma.cliente.findUnique({
                where: { id: o.clienteId },
                select: { nome: true }
            });
            return { ...o, cliente: cliente?.nome || 'Cliente' };
        }
        return o;
    }));

    return <OrcamentosClient initialOrcamentos={orcamentosWithClients} />;
}
