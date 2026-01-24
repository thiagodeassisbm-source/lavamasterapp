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
        const orcamentos = await prisma.orcamento.findMany({
            where: ctx.role !== 'superadmin' ? { empresaId: ctx.empresaId! } : {},
            include: {
                cliente: {
                    select: { nome: true }
                },
                itens: {
                    include: {
                        servico: { select: { nome: true } },
                        produto: { select: { nome: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const safeOrcamentos = orcamentos.map(o => ({
            id: o.id,
            empresaId: o.empresaId,
            clienteId: o.clienteId,
            cliente: o.cliente?.nome || 'Cliente não identificado',
            dataOrcamento: o.dataOrcamento.toISOString(),
            data: o.dataOrcamento.toISOString(),
            validade: o.validade?.toISOString() || o.dataOrcamento.toISOString(),
            valorTotal: Number(o.valorTotal || 0),
            desconto: Number(o.desconto || 0),
            valorFinal: Number(o.valorFinal || 0),
            valor: Number(o.valorFinal || 0),
            status: o.status,
            veiculo: o.observacoes?.includes('Veículo:') ? o.observacoes.split('Veículo:')[1].split('\n')[0].trim() : '',
            observacoes: o.observacoes || '',
            createdAt: o.createdAt.toISOString(),
            updatedAt: o.updatedAt.toISOString(),
            // CRUCIAL: Incluir os itens mapeados corretamente para o formulário
            itens: o.itens.map(item => ({
                id: item.id,
                servicoId: item.servicoId || '0',
                produtoId: item.produtoId || '0',
                nome: item.servico?.nome || item.produto?.nome || item.descricao,
                quantidade: Number(item.quantidade),
                precoUnitario: Number(item.valorUnitario),
                preco: Number(item.valorUnitario), // Alias
                total: Number(item.valorTotal)
            }))
        }));

        return <OrcamentosClient initialOrcamentos={safeOrcamentos} />;
    } catch (error) {
        console.error('[ORCAMENTOS] Erro fatal no servidor:', error);
        return (
            <div className="flex min-h-screen bg-slate-950 items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-xl text-white font-bold mb-4">Erro ao carregar orçamentos</h1>
                    <p className="text-slate-400">Tente recarregar a página.</p>
                </div>
            </div>
        );
    }
}
