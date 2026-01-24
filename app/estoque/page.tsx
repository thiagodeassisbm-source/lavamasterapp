import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EstoqueClient from './EstoqueClient';

export default async function EstoquePage() {
    const ctx = await getAuthContext();

    if (!ctx) {
        redirect('/');
    }

    try {
        // Buscar produtos diretamente do banco
        const produtos = await prisma.produto.findMany({
            where: ctx.role !== 'superadmin' ? { empresaId: ctx.empresaId! } : {},
            orderBy: { nome: 'asc' }
        });

        // Limpeza Total de Serialização para evitar "client-side exception"
        const safeProdutos = produtos.map(p => ({
            id: p.id,
            empresaId: p.empresaId,
            nome: p.nome,
            descricao: p.descricao || '',
            codigo: p.codigo || '',
            preco: Number(p.preco || 0),
            custo: Number(p.custo || 0),
            estoque: Number(p.estoque || 0),
            estoqueMin: Number(p.estoqueMin || 0),
            unidade: p.unidade || 'UN',
            categoria: p.categoria || '',
            ativo: p.ativo,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }));

        return <EstoqueClient initialProdutos={safeProdutos} />;
    } catch (error) {
        console.error('[ESTOQUE] Erro fatal no servidor:', error);
        return (
            <div className="flex min-h-screen bg-slate-950 items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-xl text-white font-bold mb-4">Erro ao carregar estoque</h1>
                    <p className="text-slate-400">Tente recarregar a página ou faça login novamente.</p>
                </div>
            </div>
        );
    }
}
