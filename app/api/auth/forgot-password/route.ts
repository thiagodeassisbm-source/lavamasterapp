import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';

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

        // Send Email (REAL)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.lavamaster.com.br';
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        console.log(`[AUTH] Enviando link de recuperação para ${email}`);

        const emailSent = await sendPasswordResetEmail(email, resetLink);

        if (!emailSent) {
            console.error('[AUTH] Falha ao enviar email via SMTP');
            return NextResponse.json({ error: 'Falha ao enviar email. Verifique logs do servidor.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email enviado com sucesso e processado pelo SMTP.' });

    } catch (error) {
        console.error('Erro no forgot-password:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
