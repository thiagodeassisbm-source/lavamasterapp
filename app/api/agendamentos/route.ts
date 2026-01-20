
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
    try {
        // Auth check (basic)
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        let empresaId = '';
        if (token) {
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-123');
                empresaId = decoded.empresaId;
            } catch (e) { }
        }

        // Se nao tiver empresaId do token, tenta pegar a primeira do banco (modo dev/fallback)
        if (!empresaId) {
            const emp = await prisma.empresa.findFirst();
            if (emp) empresaId = emp.id;
        }

        const agendamentos = await prisma.agendamento.findMany({
            where: {
                empresaId: empresaId
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
            cliente: a.cliente, // Exposes phone etc
            dataHora: a.dataHora.toISOString(),
            status: a.status,
            valorTotal: Number(a.valorTotal || 0),
            veiculo: a.veiculo ? `${a.veiculo.modelo} - ${a.veiculo.placa || ''}` : undefined,
            servicos: a.servicos ? a.servicos.map((s: any) => s.servico?.nome || s.servicoId) : []
        }));

        return NextResponse.json(formatted);

    } catch (error) {
        console.error('Erro ao listar agendamentos:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        let empresaId = '';
        if (token) {
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-123');
                empresaId = decoded.empresaId;
            } catch (e) { }
        }

        if (!empresaId) {
            const emp = await prisma.empresa.findFirst();
            if (emp) empresaId = emp.id;
        }

        const body = await request.json();
        let { clienteId, clienteNome, dataHora, status, observacoes, servicos, veiculo } = body;

        // 1. Tratar Cliente (Existente ou Novo)
        if (!clienteId && clienteNome) {
            // Criar novo cliente
            const novoCliente = await prisma.cliente.create({
                data: {
                    empresaId: empresaId,
                    nome: clienteNome,
                    telefone: 'Não Informado', // Obrigatório no schema
                    observacoes: 'Criado via Agendamento'
                }
            });
            clienteId = novoCliente.id;
        }

        if (!clienteId) {
            return NextResponse.json({ error: 'Cliente é obrigatório' }, { status: 400 });
        }

        // 2. Tratar Data/Hora
        const date = new Date(dataHora);

        // 3. Criar Agendamento
        const novoAgendamento = await prisma.agendamento.create({
            data: {
                empresaId: empresaId,
                clienteId: clienteId,
                dataHora: date,
                status: status || 'agendado',
                observacoes: observacoes,
                // TODO: Relacionar veículo se possível (precisa de veiculoId)
                // TODO: Relacionar serviços (precisa de tabela de serviços populada)
            }
        });

        // 4. Salvar serviços nos agendamentos (opcional por enquanto se não tiver IDs reais)
        // Se 'servicos' for array de strings (nomes), tentamos achar ou ignoramos por hora para evitar crash
        // Idealmente o frontend deveria enviar IDs de serviços reais do banco.

        return NextResponse.json(novoAgendamento);

    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 });
    }
}
