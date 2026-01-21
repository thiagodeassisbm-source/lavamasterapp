import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Retorna agendamentos filtrados por empresa
        const atendimentos = await prisma.agendamento.findMany({
            where: { empresaId: ctx.empresaId },
            include: {
                cliente: true,
                servicos: {
                    include: { servico: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Formata para manter compatibilidade com front
        const formatted = atendimentos.map(a => ({
            ...a,
            clienteNome: a.cliente?.nome,
            valorTotal: Number(a.valorTotal)
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Erro ao buscar atendimentos:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar atendimentos' },
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

        const body = await request.json();

        const novoAtendimento = await prisma.agendamento.create({
            data: {
                empresaId: ctx.empresaId,
                clienteId: body.clienteId,
                veiculoId: body.veiculoId,
                dataHora: body.dataHora ? new Date(body.dataHora) : new Date(),
                status: body.status || 'em_andamento',
                observacoes: body.observacoes,
                valorTotal: parseFloat(body.valorTotal) || 0
            },
            include: { cliente: true }
        });

        return NextResponse.json(novoAtendimento);
    } catch (error: any) {
        console.error('Erro ao salvar atendimento:', error);
        return NextResponse.json(
            { error: 'Erro ao salvar atendimento' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        // Verifica se o atendimento pertence à empresa do usuário
        const atendimentoExistente = await prisma.agendamento.findUnique({
            where: { id }
        });

        if (!atendimentoExistente || atendimentoExistente.empresaId !== ctx.empresaId) {
            return NextResponse.json({ error: 'Atendimento não encontrado ou acesso negado' }, { status: 404 });
        }

        const atendimentoAtualizado = await prisma.agendamento.update({
            where: { id },
            data: {
                status: updates.status,
                observacoes: updates.observacoes,
                valorTotal: updates.valorTotal !== undefined ? parseFloat(updates.valorTotal) : undefined,
                dataHora: updates.dataHora ? new Date(updates.dataHora) : undefined
            }
        });

        return NextResponse.json(atendimentoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar atendimento:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar atendimento' },
            { status: 500 }
        );
    }
}
