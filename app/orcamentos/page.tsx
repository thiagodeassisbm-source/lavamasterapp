import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrcamentosClient from './OrcamentosClient';

export default async function OrcamentosPage() {
    const ctx = await getAuthContext();

    if (!ctx) {
        redirect('/');
    }

    try {
        // Buscar orçamentos diretamente do banco com join de cliente
        const orcamentos = await prisma.orcamento.findMany({
            where: ctx.role !== 'superadmin' ? { empresaId: ctx.empresaId! } : {},
            include: {
                cliente: {
                    select: { nome: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Serialization Clean: Removendo QUALQUER objeto Date original que o Prisma retorna
        // para evitar o erro de "client-side exception" (Serialization Error)
        const safeOrcamentos = orcamentos.map(o => ({
            id: o.id,
            empresaId: o.empresaId,
            clienteId: o.clienteId,
            cliente: o.cliente?.nome || 'Cliente não identificado',
            dataOrcamento: o.dataOrcamento.toISOString(),
            data: o.dataOrcamento.toISOString(), // Alias comum no front
            validade: o.validade?.toISOString() || o.dataOrcamento.toISOString(),
            valorTotal: Number(o.valorTotal || 0),
            desconto: Number(o.desconto || 0),
            valorFinal: Number(o.valorFinal || 0),
            valor: Number(o.valorFinal || 0), // Alias comum no front
            status: o.status,
            observacoes: o.observacoes || '',
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
        }));

        return <OrcamentosClient initialOrcamentos={safeOrcamentos} />;
    } catch (error) {
        console.error('[ORCAMENTOS] Erro fatal no servidor:', error);
        // Fallback para não quebrar o site
        return (
            <div className="flex min-h-screen bg-slate-950 items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-xl text-white font-bold mb-4">Erro ao carregar orçamentos</h1>
                    <p className="text-slate-400">Por favor, tente recarregar a página ou faça login novamente.</p>
                </div>
            </div>
        );
    }
}
