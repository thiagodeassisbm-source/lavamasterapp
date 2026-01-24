import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filterEmpresaId = searchParams.get('empresaId');

        const where: any = {};
        if (ctx.role !== 'superadmin') {
            where.empresaId = ctx.empresaId;
        } else if (filterEmpresaId) {
            where.empresaId = filterEmpresaId;
        }

        const orcamentos = await prisma.orcamento.findMany({
            where: where,
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        servico: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(orcamentos);
    } catch (error) {
        console.error('Erro ao buscar orçamentos:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar orçamentos' },
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

        // Extrai itens e dados do orçamento
        const { itens, ...orcamentoData } = data;

        // Se for superadmin, pode vir no body, senão usa o do contexto
        const empresaId = (ctx.role === 'superadmin' ? data.empresaId : ctx.empresaId) || ctx.empresaId;

        if (!empresaId) {
            return NextResponse.json({ error: 'EmpresaId é obrigatório' }, { status: 400 });
        }

        const novoOrcamento = await prisma.orcamento.create({
            data: {
                empresaId: empresaId,
                clienteId: orcamentoData.clienteId,
                dataOrcamento: orcamentoData.dataOrcamento ? new Date(orcamentoData.dataOrcamento) : new Date(),
                validade: orcamentoData.validade ? new Date(orcamentoData.validade) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                valorTotal: parseFloat(orcamentoData.valorTotal) || 0,
                desconto: parseFloat(orcamentoData.desconto) || 0,
                valorFinal: parseFloat(orcamentoData.valorFinal) || 0,
                status: orcamentoData.status || 'pendente',
                observacoes: orcamentoData.observacoes,
                itens: {
                    create: itens?.map((item: any) => ({
                        // Importante: Se o ID for vazio ou '0', passamos null para não quebrar a chave estrangeira
                        produtoId: (item.produtoId && item.produtoId !== '0') ? item.produtoId : null,
                        servicoId: (item.servicoId && item.servicoId !== '0') ? item.servicoId : null,
                        descricao: item.descricao || 'Item de orçamento',
                        quantidade: parseInt(item.quantidade) || 1,
                        valorUnitario: parseFloat(item.valorUnitario) || 0,
                        valorTotal: parseFloat(item.valorTotal) || 0
                    }))
                }
            },
            include: { itens: true }
        });

        return NextResponse.json(novoOrcamento);

    } catch (error: any) {
        console.error('Erro ao salvar orçamento:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
