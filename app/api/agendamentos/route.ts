import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const agendamentos = await prisma.agendamento.findMany({
            where: {
                empresaId: ctx.empresaId
            },
            include: {
                cliente: true,
                veiculo: true,
                servicos: {
                    include: {
                        servico: true
                    }
                }
            },
            orderBy: {
                dataHora: 'asc'
            }
        });

        const formatted = agendamentos.map(a => ({
            id: a.id,
            clienteNome: a.cliente?.nome || 'Cliente Desconhecido',
            clienteId: a.clienteId,
            cliente: a.cliente,
            dataHora: a.dataHora.toISOString(),
            status: a.status,
            valorTotal: Number(a.valorTotal || 0),
            veiculo: a.veiculo ? `${a.veiculo.modelo} - ${a.veiculo.placa || ''}` : undefined,
            servicos: a.servicos ? a.servicos.map((s: any) => s.servico?.nome || s.servicoId) : [],
            createdAt: a.createdAt,
            updatedAt: a.updatedAt
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        console.error('Erro ao listar agendamentos:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();

        // VERIFICAÇÃO DE LIMITE DE AGENDAMENTOS
        const empresa = await prisma.empresa.findUnique({
            where: { id: ctx.empresaId },
            include: {
                _count: {
                    select: { agendamentos: true }
                }
            }
        });

        // @ts-ignore
        if (empresa && empresa.limiteAgendamentos > 0 && empresa._count.agendamentos >= empresa.limiteAgendamentos) {
            return NextResponse.json(
                // @ts-ignore
                { error: `Limite de agendamentos atingido. Seu plano permite apenas ${empresa.limiteAgendamentos} agendamentos.` },
                { status: 403 }
            );
        }

        let { clienteId, clienteNome, dataHora, status, observacoes, servicos, veiculo } = body;

        // 1. Tratar Cliente (Existente ou Novo)
        if (!clienteId && clienteNome) {
            const novoCliente = await prisma.cliente.create({
                data: {
                    empresaId: ctx.empresaId,
                    nome: clienteNome,
                    telefone: 'Não Informado',
                    observacoes: 'Criado via Agendamento'
                }
            });
            clienteId = novoCliente.id;
        }

        if (!clienteId) {
            return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });
        }

        const date = new Date(dataHora);

        const novoAgendamento = await prisma.agendamento.create({
            data: {
                empresaId: ctx.empresaId,
                clienteId: clienteId,
                dataHora: date,
                status: status || 'agendado',
                observacoes: observacoes,
            }
        });

        return NextResponse.json(novoAgendamento);

    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
    }
}
