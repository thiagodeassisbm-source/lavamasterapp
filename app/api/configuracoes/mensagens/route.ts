import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (!ctx || !ctx.empresaId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const empresa = await prisma.empresa.findUnique({
            where: { id: ctx.empresaId }
        });

        if (!empresa) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });

        return NextResponse.json({ message: (empresa as any).mensagemConfirmacaoAgendamento || '' });
    } catch (error) {
        console.error('Erro ao buscar mensagem:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (!ctx || !ctx.empresaId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { message } = await request.json();

        await prisma.empresa.update({
            where: { id: ctx.empresaId },
            data: {
                mensagemConfirmacaoAgendamento: message
            } as any
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
