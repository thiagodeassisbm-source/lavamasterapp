import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    context: any
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Compatibilidade Next.js 14/15
        const params = await context.params;
        const id = params.id;
        const data = await request.json();

        const orcamento = await prisma.orcamento.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!orcamento) {
            return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
        }

        const updatedOrcamento = await prisma.orcamento.update({
            where: { id: id },
            data: {
                dataOrcamento: data.dataOrcamento ? new Date(data.dataOrcamento) : undefined,
                validade: data.validade ? new Date(data.validade) : undefined,
                valorTotal: data.valorTotal !== undefined ? parseFloat(data.valorTotal) : undefined,
                desconto: data.desconto !== undefined ? parseFloat(data.desconto) : undefined,
                valorFinal: data.valorFinal !== undefined ? parseFloat(data.valorFinal) : undefined,
                status: data.status,
                observacoes: data.observacoes,
            }
        });

        return NextResponse.json(updatedOrcamento);

    } catch (error: any) {
        console.error('Erro ao atualizar orçamento:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: any
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const params = await context.params;
        const id = params.id;

        const orcamento = await prisma.orcamento.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!orcamento) {
            return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
        }

        await prisma.orcamento.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Erro ao excluir orçamento:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
