import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET: Perfil do Usuário
export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const user = await prisma.usuario.findUnique({
            where: { id: ctx.userId },
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                bio: true,
                role: true,
                empresaId: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// PUT: Atualizar Perfil (incluindo senha)
export async function PUT(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const body = await request.json();
        const { nome, email, telefone, bio, senhaNova } = body;

        const updateData: any = {
            nome,
            email: email?.trim().toLowerCase(),
            telefone,
            bio
        };

        if (senhaNova && senhaNova.trim().length >= 6) {
            const hashedPassword = await bcrypt.hash(senhaNova.trim(), 10);
            updateData.senha = hashedPassword;
        }

        await prisma.usuario.update({
            where: { id: ctx.userId },
            data: updateData
        });

        return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso' });

    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error);

        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
        }

        return NextResponse.json({ error: error.message || 'Erro ao atualizar.' }, { status: 500 });
    }
}
