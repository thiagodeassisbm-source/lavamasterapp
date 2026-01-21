import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const produtos = await prisma.produto.findMany({
            where: { empresaId: ctx.empresaId },
            orderBy: { nome: 'asc' }
        });

        return NextResponse.json(produtos);
    } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar estoque' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const data = await request.json();

        const novoProduto = await prisma.produto.create({
            data: {
                empresaId: ctx.empresaId,
                nome: data.nome,
                descricao: data.descricao,
                codigo: data.codigo,
                preco: parseFloat(data.preco) || 0,
                custo: parseFloat(data.custo) || 0,
                estoque: parseInt(data.estoque) || 0,
                estoqueMin: parseInt(data.estoqueMin) || 0,
                unidade: data.unidade || 'UN',
                categoria: data.categoria,
                ativo: true
            }
        });

        return NextResponse.json(novoProduto);

    } catch (error: any) {
        console.error('Erro ao salvar produto:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
