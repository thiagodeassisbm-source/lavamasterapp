import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EstoqueClient from './EstoqueClient';

export default async function EstoquePage() {
    const ctx = await getAuthContext();

    if (!ctx) {
        redirect('/');
    }

    // Buscar produtos diretamente do banco
    const produtos = await prisma.produto.findMany({
        where: ctx.role !== 'superadmin' ? { empresaId: ctx.empresaId! } : {},
        orderBy: { nome: 'asc' }
    });

    // Converter datas para string para evitar problemas de serialização
    const formattedProdutos = produtos.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    }));

    return <EstoqueClient initialProdutos={formattedProdutos} />;
}
