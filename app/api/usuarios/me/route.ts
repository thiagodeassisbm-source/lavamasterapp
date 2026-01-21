import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Get Current User Profile
export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        let userId = '';
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-123');
            // FIX: Login uses 'sub' for userId, not 'id'
            userId = decoded.sub || decoded.id;
        } catch (e) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Usuário não identificado no token' }, { status: 401 });
        }

        // Use Raw Query to bypass outdated Prisma Client (due to hot-reload locking)
        try {
            const users: any = await prisma.$queryRaw`
                SELECT id, nome, email, telefone, bio, role 
                FROM usuarios 
                WHERE id = ${userId} 
                LIMIT 1
            `;

            if (!users || users.length === 0) {
                console.log('User not found for ID:', userId);
                return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
            }

            return NextResponse.json(users[0]);
        } catch (dbError) {
            console.error('Raw query failed', dbError);
            const user = await prisma.usuario.findUnique({
                where: { id: userId },
                // @ts-ignore
                select: { id: true, nome: true, email: true, telefone: true, bio: true, role: true }
            });
            return NextResponse.json(user);
        }

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

// Update Profile
export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

        let userId = '';
        try {
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-123');
            // FIX: Use 'sub' or 'id'
            userId = decoded.sub || decoded.id;
        } catch (e) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const body = await request.json();
        const { nome, email, telefone, bio, role } = body;

        try {
            await prisma.$executeRaw`
                UPDATE usuarios 
                SET nome=${nome}, email=${email}, telefone=${telefone}, bio=${bio}, role=${role}
                WHERE id=${userId}
            `;

            return NextResponse.json({ success: true });
        } catch (dbError) {
            console.error('Raw update failed', dbError);
            // @ts-ignore
            await prisma.usuario.update({
                where: { id: userId },
                data: { nome, email, telefone, bio, role }
            });
            return NextResponse.json({ success: true });
        }

    } catch (error: any) {
        console.error('Erro ao atualizar perfil:', error);
        return NextResponse.json({ error: error.message || 'Erro ao atualizar.' }, { status: 500 });
    }
}
