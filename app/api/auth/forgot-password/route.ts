import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
        }

        const usuario = await prisma.usuario.findFirst({
            where: { email }
        });

        // Even if user not found, return success to prevent email enumeration attacks
        // But for development/UX requests usually prefer explicit errors.
        // Let's return success but log internally.
        if (!usuario) {
            console.log(`[Forgot Password] Email not found: ${email}`);
            // Fake delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return NextResponse.json({ message: 'Se o email existir, um link foi enviado.' });
        }

        // Generate Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save to DB
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                resetToken,
                resetTokenExpires
            }
        });

        // Send Email (MOCK)
        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        console.log('========================================================');
        console.log(`[EMAIL MOCK] Enviando email para: ${email}`);
        console.log(`[EMAIL MOCK] Link de Recuperação: ${resetLink}`);
        console.log('========================================================');

        // TODO: Integrate real email provider here (e.g., Resend, SendGrid, Nodemailer)

        return NextResponse.json({ message: 'Email enviado com sucesso' });

    } catch (error) {
        console.error('Erro no forgot-password:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
