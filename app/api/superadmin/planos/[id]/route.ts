import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    request: Request,
    context: any
) {
    try {
        const params = await context.params;
        const id = params.id;
        const data = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
        }

        // @ts-ignore
        const plano = await prisma.plano.update({
            where: { id: id },
            data: {
                nome: data.nome,
                descricao: data.descricao,
                preco: data.preco !== undefined ? Number(data.preco) : undefined,
                intervalo: data.intervalo,
                limiteUsuarios: data.limiteUsuarios !== undefined ? Number(data.limiteUsuarios) : undefined,
                limiteClientes: data.limiteClientes !== undefined ? Number(data.limiteClientes) : undefined,
                limiteAgendamentos: data.limiteAgendamentos !== undefined ? Number(data.limiteAgendamentos) : undefined,
                duracaoDias: data.duracaoDias !== undefined ? (data.duracaoDias ? Number(data.duracaoDias) : null) : undefined,
                ativo: data.ativo,
                destaque: data.destaque
            }
        });

        return NextResponse.json(plano);
    } catch (error: any) {
        console.error('Erro ao atualizar plano:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Erro ao atualizar plano'
        }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    context: any
) {
    try {
        const params = await context.params;
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
        }

        // @ts-ignore
        await prisma.plano.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir plano:', error);
        return NextResponse.json({ error: 'Erro ao excluir plano' }, { status: 500 });
    }
}
