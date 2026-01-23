import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const id = params.id;
        const data = await request.json();

        // Atualiza o serviço no banco de dados
        const updatedServico = await prisma.servico.update({
            where: {
                id,
                empresaId: ctx.empresaId || undefined // Segurança: garante que pertence à empresa
            },
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
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const id = params.id;

        // Marcamos como inativo em vez de deletar para manter histórico se necessário,
        // mas o sistema atual parece filtrar por ativo: true.
        // Se preferir deletar fisicamente:
        await prisma.servico.update({
            where: {
                id,
                empresaId: ctx.empresaId || undefined
            },
            data: {
                ativo: false
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting service:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
