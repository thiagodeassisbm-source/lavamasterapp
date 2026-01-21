import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const clientes = await prisma.cliente.findMany({
            where: { empresaId: ctx.empresaId },
            include: { veiculos: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(clientes);
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar clientes no banco' },
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

        // VERIFICAÇÃO DE LIMITE DE CLIENTES
        const empresa = await prisma.empresa.findUnique({
            where: { id: ctx.empresaId },
            include: {
                _count: {
                    select: { clientes: true }
                }
            }
        });

        if (empresa && empresa.limiteClientes > 0 && empresa._count.clientes >= empresa.limiteClientes) {
            return NextResponse.json(
                { error: `Limite de clientes atingido. Seu plano permite apenas ${empresa.limiteClientes} clientes.` },
                { status: 403 }
            );
        }

        const { veiculos, ...clienteData } = data;

        // Cria Cliente + Veiculos garantindo o empresaId do usuário logado
        const novoCliente = await prisma.cliente.create({
            data: {
                empresaId: ctx.empresaId,
                nome: clienteData.nome,
                telefone: clienteData.telefone,
                cpf: clienteData.cpf,
                email: clienteData.email,
                endereco: clienteData.endereco,
                cidade: clienteData.cidade,
                estado: clienteData.estado,
                cep: clienteData.cep,
                dataNascimento: clienteData.dataNascimento ? new Date(clienteData.dataNascimento) : null,
                observacoes: clienteData.observacoes,
                veiculos: {
                    create: veiculos?.map((v: any) => ({
                        marca: v.marca || 'N/A',
                        modelo: v.modelo || 'N/A',
                        placa: v.placa,
                        ano: v.ano ? parseInt(v.ano) : null,
                        cor: v.cor
                    }))
                }
            },
            include: { veiculos: true }
        });

        return NextResponse.json(novoCliente);

    } catch (error: any) {
        console.error('Erro ao criar cliente:', error);
        return NextResponse.json(
            { error: `Erro ao salvar no banco: ${error.message}` },
            { status: 500 }
        );
    }
}
