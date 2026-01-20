
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getEmpresaId() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (token) {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-123');
            return decoded.empresaId;
        }
    } catch (e) { }

    // Fallback para dev
    const emp = await prisma.empresa.findFirst();
    return emp?.id;
}

export async function GET(request: Request) {
    try {
        const empresaId = await getEmpresaId();
        if (!empresaId) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });

        // Use 'as any' because typescript might not know about the new field yet if generate failed
        return NextResponse.json({ message: (empresa as any)?.mensagemConfirmacaoAgendamento || '' });
    } catch (error) {
        console.error('Erro ao buscar mensagem:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const empresaId = await getEmpresaId();
        if (!empresaId) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });

        const { message } = await request.json();

        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                mensagemConfirmacaoAgendamento: message
            } as any // Cast to avoid TS error if client not generated
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
