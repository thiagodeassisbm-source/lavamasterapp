import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const data = await request.json();

        // @ts-ignore
        if (!prisma.plano) {
            return NextResponse.json({ error: 'Erro de Servidor: Modelo de Banco de Dados não sincronizado.' }, { status: 500 });
        }

        // @ts-ignore
        const plano = await prisma.plano.update({
            where: { id: params.id },
            data: {
                nome: data.nome,
                descricao: data.descricao,
                preco: Number(data.preco),
                intervalo: data.intervalo,
                limiteUsuarios: Number(data.limiteUsuarios),
                limiteClientes: Number(data.limiteClientes),
                limiteAgendamentos: Number(data.limiteAgendamentos),
                duracaoDias: data.duracaoDias ? Number(data.duracaoDias) : null,
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        // @ts-ignore
        await prisma.plano.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir plano:', error);
        return NextResponse.json({ error: 'Erro ao excluir plano' }, { status: 500 });
    }
}
