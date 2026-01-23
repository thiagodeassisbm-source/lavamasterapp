import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx || !ctx.empresaId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const atendimento = await prisma.agendamento.findUnique({
                where: { id, empresaId: ctx.empresaId },
                include: {
                    cliente: { include: { veiculos: true } },
                    veiculo: true,
                    servicos: { include: { servico: true } }
                }
            });

            if (!atendimento) {
                return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
            }

            const formatted = {
                ...atendimento,
                clienteNome: atendimento.cliente?.nome || 'Cliente Desconhecido',
                veiculo: atendimento.veiculo ? `${atendimento.veiculo.modelo} - ${atendimento.veiculo.placa || ''}` : (atendimento.cliente?.veiculos?.[0] ? `${atendimento.cliente.veiculos[0].modelo} - ${atendimento.cliente.veiculos[0].placa || ''}` : ''),
                servicos: atendimento.servicos?.map((s: any) => ({
                    id: s.servicoId,
                    nome: s.servico?.nome
                })).filter((s: any) => !!s.nome) || [],
                totalAgendamento: Number(atendimento.valorTotal),
                valorTotal: Number(atendimento.valorTotal)
            };

            return NextResponse.json(formatted);
        }

        // Retorna agendamentos filtrados por empresa
        const atendimentos = await prisma.agendamento.findMany({
            where: { empresaId: ctx.empresaId },
            include: {
                cliente: {
                    include: { veiculos: true }
                },
                veiculo: true,
                servicos: {
                    include: { servico: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Formata para manter compatibilidade com front
        const formatted = atendimentos.map((a: any) => {
            const veiculoObj = a.veiculo || a.cliente?.veiculos?.[0];
            const veiculoStr = veiculoObj ? `${veiculoObj.modelo} - ${veiculoObj.placa || ''}` : '';

            return {
                ...a,
                clienteNome: a.cliente?.nome || 'Cliente Desconhecido',
                veiculo: veiculoStr,
                servicos: a.servicos?.map((s: any) => ({
                    id: s.servicoId,
                    nome: s.servico?.nome
                })).filter((s: any) => !!s.nome) || [],
                totalAgendamento: Number(a.valorTotal),
                valorTotal: Number(a.valorTotal)
            };
        });

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
        if (!ctx || !ctx.empresaId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { clienteId, veiculoId, dataHora, status, observacoes, valorTotal, servicos, desconto, formaPagamento } = body;

        const createData: any = {
            empresaId: ctx.empresaId,
            clienteId: clienteId,
            veiculoId: veiculoId,
            dataHora: dataHora ? new Date(dataHora) : new Date(),
            status: status || 'em_andamento',
            observacoes: observacoes,
            valorTotal: Number(valorTotal) || 0,
            desconto: Number(desconto) || 0,
            formaPagamento: formaPagamento,
            servicos: {
                create: servicos?.map((s: any) => ({
                    servicoId: s.servicoId,
                    quantidade: 1,
                    valorUnitario: Number(s.preco) || 0,
                    valorTotal: Number(s.preco) || 0
                }))
            }
        };

        const novoAtendimento = await prisma.agendamento.create({
            data: createData,
            include: {
                cliente: true,
                servicos: { include: { servico: true } }
            }
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
        if (!ctx || !ctx.empresaId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { id, clienteId, veiculoId, dataHora, status, observacoes, valorTotal, servicos, desconto, formaPagamento } = body;

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

        // Atualização básica
        const updateData: any = {
            clienteId: clienteId || undefined,
            veiculoId: veiculoId || undefined,
            status: status,
            observacoes: observacoes,
            valorTotal: valorTotal !== undefined ? Number(valorTotal) : undefined,
            desconto: desconto !== undefined ? Number(desconto) : undefined,
            formaPagamento: formaPagamento,
            dataHora: dataHora ? new Date(dataHora) : undefined
        };

        const atendimentoAtualizado = await prisma.agendamento.update({
            where: { id },
            data: updateData
        });

        // Atualização de serviços
        if (servicos && Array.isArray(servicos)) {
            await prisma.agendamentoServico.deleteMany({
                where: { agendamentoId: id }
            });

            if (servicos.length > 0) {
                await prisma.agendamentoServico.createMany({
                    data: servicos.map((s: any) => ({
                        agendamentoId: id,
                        servicoId: s.servicoId,
                        quantidade: 1,
                        valorUnitario: Number(s.preco) || 0,
                        valorTotal: Number(s.preco) || 0
                    }))
                });
            }
        }

        return NextResponse.json(atendimentoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar atendimento:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar atendimento' },
            { status: 500 }
        );
    }
}
