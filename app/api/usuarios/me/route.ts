import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Usar a instância corrigida do lib/prisma
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro-lava-master-2026';

// Helper de autenticação
async function getUserId() {
    const cookieStore = await cookies();
    // Tenta pegar o cookie correto 'auth_token' ou o antigo 'auth-token' por garantia
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

    if (!token) return null;

    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        // O payload do login usa 'id', não 'sub'
        return decoded.id || decoded.sub;
    } catch (e) {
        return null;
    }
}

// GET: Perfil do Usuário
export async function GET(request: Request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const user = await prisma.usuario.findUnique({
            where: { id: userId },
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
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        const body = await request.json();
        const { nome, email, telefone, bio, senhaNova } = body;

        // Montar objeto de atualização
        const updateData: any = {
            nome,
            email: email?.trim().toLowerCase(),
            telefone,
            bio
        };

        // Se enviou senha nova, fazer hash e atualizar
        if (senhaNova && senhaNova.trim().length >= 6) {
            const hashedPassword = await bcrypt.hash(senhaNova.trim(), 10);
            updateData.senha = hashedPassword;
        }

        await prisma.usuario.update({
            where: { id: userId },
            data: updateData
        });

        return NextResponse.json({ success: true, message: 'Perfil atualizado com sucesso' });

    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error);

        // Tratar erro de email duplicado
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
        }

        return NextResponse.json({ error: error.message || 'Erro ao atualizar.' }, { status: 500 });
    }
}
