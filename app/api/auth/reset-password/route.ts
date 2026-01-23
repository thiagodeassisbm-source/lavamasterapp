import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token e senha são obrigatórios' }, { status: 400 });
        }

        // Find user by token and ensure token is not expired
        const usuario = await prisma.usuario.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: {
                    gt: new Date() // Greater than now
                }
            }
        });

        if (!usuario) {
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update User
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                senha: hashedPassword,
                resetToken: null,
                resetTokenExpires: null,
                // Also unlock account if locked?
                lockoutUntil: null,
                failedLoginAttempts: 0
            }
        });

        return NextResponse.json({ message: 'Senha atualizada com sucesso' });

    } catch (error) {
        console.error('Erro no reset-password:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
