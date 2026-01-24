import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const { id } = await context.params;
        const ctx = await getAuthContext();

        // Se for admin/gerente/superadmin, pode ver qualquer cliente da empresa
        // se for usuário comum, também (nesse sistema as empresas compartilham clientes internamente)
        const cliente = await prisma.cliente.findUnique({
            where: { id },
            include: { veiculos: true }
        });

        if (!cliente) {
            return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
        }

        // Segurança: Verificar empresa
        if (ctx && ctx.role !== 'superadmin' && cliente.empresaId !== ctx.empresaId) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        return NextResponse.json(cliente);
    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const { id } = await context.params;
        const data = await request.json();
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { veiculos, id: _id, createdAt, updatedAt, ...clienteData } = data;

        // Verificar se pertence à empresa antes de atualizar
        const existing = await prisma.cliente.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!existing && ctx.role !== 'superadmin') {
            return NextResponse.json({ error: 'Cliente não encontrado ou sem permissão' }, { status: 404 });
        }

        const updated = await prisma.cliente.update({
            where: { id },
            data: {
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
                    deleteMany: {}, // Remove anteriores
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

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('PUT Error:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Cliente não encontrado para atualização' }, { status: 404 });
        }
        return NextResponse.json(
            { error: `Erro ao atualizar: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        const { id } = await context.params;
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verifica se pertence à empresa
        const existing = await prisma.cliente.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!existing && ctx.role !== 'superadmin') {
            return NextResponse.json({ error: 'Cliente não encontrado ou sem permissão' }, { status: 404 });
        }

        await prisma.cliente.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Cliente excluído com sucesso' });
    } catch (error: any) {
        console.error('DELETE Error:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
        }
        return NextResponse.json(
            { error: `Erro ao excluir: ${error.message}` },
            { status: 500 }
        );
    }
}
