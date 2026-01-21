import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const despesas = await prisma.despesa.findMany({
            where: { empresaId: ctx.empresaId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(despesas);
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar despesas' },
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

        const novaDespesa = await prisma.despesa.create({
            data: {
                empresaId: ctx.empresaId,
                descricao: data.descricao,
                valor: parseFloat(data.valor) || 0,
                categoria: data.categoria || 'Geral',
                dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : new Date(),
                dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
                status: data.status || 'pendente',
                observacoes: data.observacoes
            }
        });

        return NextResponse.json(novaDespesa);
    } catch (error: any) {
        console.error('Erro ao salvar despesa:', error);
        return NextResponse.json(
            { error: 'Erro ao salvar despesa' },
            { status: 500 }
        );
    }
}
