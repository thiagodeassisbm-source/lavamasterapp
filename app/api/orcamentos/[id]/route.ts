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

        const params = await context.params;
        const id = params.id;
        const data = await request.json();

        // 1. Verificar se o orçamento existe e pertence à empresa
        const orcamentoExistente = await prisma.orcamento.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!orcamentoExistente) {
            return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
        }

        const { itens, ...orcamentoData } = data;

        // 2. Atualizar o orçamento e substituir os itens (Atomic Transaction)
        const updatedOrcamento = await prisma.$transaction(async (tx) => {
            // Deletar itens antigos
            await tx.itemOrcamento.deleteMany({
                where: { orcamentoId: id }
            });

            // Criar novos itens
            return await tx.orcamento.update({
                where: { id: id },
                data: {
                    dataOrcamento: orcamentoData.dataOrcamento ? new Date(orcamentoData.dataOrcamento) : undefined,
                    validade: orcamentoData.validade ? new Date(orcamentoData.validade) : undefined,
                    valorTotal: parseFloat(orcamentoData.valorTotal) || 0,
                    desconto: parseFloat(orcamentoData.desconto) || 0,
                    valorFinal: parseFloat(orcamentoData.valorFinal) || 0,
                    status: orcamentoData.status,
                    observacoes: orcamentoData.observacoes,
                    clienteId: orcamentoData.clienteId,
                    itens: {
                        create: (itens || []).map((item: any) => ({
                            produtoId: (item.produtoId && item.produtoId !== '0') ? item.produtoId : null,
                            servicoId: (item.servicoId && item.servicoId !== '0') ? item.servicoId : null,
                            descricao: item.descricao || item.nome || 'Item',
                            quantidade: parseInt(item.quantidade) || 1,
                            valorUnitario: parseFloat(item.valorUnitario || item.precoUnitario) || 0,
                            valorTotal: parseFloat(item.valorTotal || item.total) || 0
                        }))
                    }
                },
                include: { itens: true }
            });
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
