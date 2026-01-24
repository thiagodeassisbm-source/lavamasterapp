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

        // Verificar se o serviço existe e pertence à empresa
        const servico = await prisma.servico.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!servico) {
            return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
        }

        const updatedServico = await prisma.servico.update({
            where: { id: id },
            data: {
                nome: data.nome,
                descricao: data.descricao,
                preco: parseFloat(data.preco) || 0,
                duracao: parseInt(data.duracao) || 30,
                categoria: data.categoria,
            },
        });

        return NextResponse.json(updatedServico);
    } catch (error: any) {
        console.error('Error updating service:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
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

        // Verificar se pertence à empresa
        const servico = await prisma.servico.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!servico) {
            return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
        }

        // Marcar como inativo
        await prisma.servico.update({
            where: { id: id },
            data: { ativo: false }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting service:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
