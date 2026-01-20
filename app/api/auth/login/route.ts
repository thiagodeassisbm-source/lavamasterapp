
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutos em ms

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 1. Sanitizar entrada básica (trim)
        const sanitizedEmail = email?.trim();

        if (!sanitizedEmail || !password) {
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // 2. Buscar usuário sem revelar se existe ainda
        const usuario = await prisma.usuario.findFirst({
            where: { email: sanitizedEmail }
        });

        // Simula tempo de resposta constante para evitar Timing Attacks se usuário não existir
        // (Isso é uma mitigação básica, o ideal é ter hash fake)
        if (!usuario) {
            // Delay fake
            await new Promise(resolve => setTimeout(resolve, 500));
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        // 3. Verificar Bloqueio de Conta
        if (usuario.lockoutUntil) {
            const now = new Date();
            if (now < usuario.lockoutUntil) {
                const waitMinutes = Math.ceil((usuario.lockoutUntil.getTime() - now.getTime()) / 60000);
                return NextResponse.json(
                    { error: `Conta bloqueada por muitas tentativas. Tente novamente em ${waitMinutes} minutos.` },
                    { status: 429 } // Too Many Requests
                );
            } else {
                // Bloqueio expirou, reseta contador
                await prisma.usuario.update({
                    where: { id: usuario.id },
                    data: {
                        failedLoginAttempts: 0,
                        lockoutUntil: null
                    }
                });
            }
        }

        // 4. Verificar senha
        const senhaValida = await bcrypt.compare(password, usuario.senha);

        if (!senhaValida) {
            // Incrementa tentativas falhas
            const newAttempts = (usuario.failedLoginAttempts || 0) + 1;
            let updateData: any = { failedLoginAttempts: newAttempts };

            // Se exceder limite, bloqueia
            if (newAttempts >= MAX_ATTEMPTS) {
                updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_TIME_MS);
            }

            await prisma.usuario.update({
                where: { id: usuario.id },
                data: updateData
            });

            const attemptsLeft = MAX_ATTEMPTS - newAttempts;
            const msg = attemptsLeft > 0
                ? 'Credenciais inválidas'
                : 'Muitas tentativas falhas. Conta bloqueada temporariamente.';

            return NextResponse.json(
                { error: msg },
                { status: 401 }
            );
        }

        // 5. Verificar se está ativo
        if (!usuario.ativo) {
            return NextResponse.json(
                { error: 'Usuário desativado. Entre em contato com o administrador.' },
                { status: 403 }
            );
        }

        // 6. Sucesso: Resetar contadores de segurança
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                failedLoginAttempts: 0,
                lockoutUntil: null
            }
        });

        // 7. Gerar Token JWT
        const token = jwt.sign(
            {
                sub: usuario.id,
                email: usuario.email,
                role: usuario.role,
                empresaId: usuario.empresaId
            },
            process.env.JWT_SECRET || 'dev-secret-key-123',
            { expiresIn: '1d' }
        );

        // Remover senha e dados de segurança do retorno
        const { senha: _, failedLoginAttempts: __, lockoutUntil: ___, ...usuarioSemSenha } = usuario;

        const response = NextResponse.json({
            token,
            user: usuarioSemSenha
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400 // 1 dia
        });

        return response;

    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json(
            { error: 'Erro interno ao realizar login' },
            { status: 500 }
        );
    }
}
