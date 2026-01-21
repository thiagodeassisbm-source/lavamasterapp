
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutos em ms
const JWT_SECRET = process.env.JWT_SECRET || 'lavamaster-secret-2026-production'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // 1. Sanitizar entrada básica (trim)
        const sanitizedEmail = email?.trim().toLowerCase();
        console.log('>>> [DEBUG LOGIN] Tentando logar:', sanitizedEmail);

        if (!sanitizedEmail || !password) {
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // 2. Buscar usuário
        const usuario = await prisma.usuario.findFirst({
            where: { email: sanitizedEmail }
        });

        if (!usuario) {
            console.log('>>> [DEBUG LOGIN] Usuário não encontrado no banco:', sanitizedEmail);
            // Delay fake
            await new Promise(resolve => setTimeout(resolve, 500));
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        console.log('>>> [DEBUG LOGIN] Usuário encontrado:', usuario.email, '| Role:', usuario.role);

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

        // 5. Verificar Empresa e Plano (Bloqueio ou Expiração)
        // @ts-ignore
        const empresa = await prisma.empresa.findUnique({
            where: { id: usuario.empresaId }
        });

        if (!empresa || !empresa.ativo) {
            return NextResponse.json(
                { error: 'Empresa inativa. Entre em contato com o suporte.' },
                { status: 403 }
            );
        }

        if (empresa.bloqueado) {
            return NextResponse.json(
                { error: `Acesso suspenso: ${empresa.motivoBloqueio || 'Consulte a administração'}` },
                { status: 403 }
            );
        }

        // Verificação de Expiração do Plano
        if (empresa.dataExpiracao) {
            const hoje = new Date();
            const expira = new Date(empresa.dataExpiracao);

            if (hoje > expira) {
                return NextResponse.json(
                    { error: 'Seu período de teste ou assinatura expirou. Regularize sua conta para continuar.' },
                    { status: 403 }
                );
            }
        }

        // 6. Verificar se o usuário está ativo
        if (!usuario.ativo) {
            return NextResponse.json(
                { error: 'Seu usuário está desativado. Entre em contato com o administrador da sua empresa.' },
                { status: 403 }
            );
        }

        // 7. Sucesso: Resetar contadores de segurança
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
                id: usuario.id,
                email: usuario.email,
                role: usuario.role,
                empresaId: usuario.empresaId
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Remover senha e dados de segurança do retorno
        const { senha: _, failedLoginAttempts: __, lockoutUntil: ___, ...usuarioSemSenha } = usuario;

        const response = NextResponse.json({
            token,
            user: usuarioSemSenha
        });

        response.cookies.set('auth_token', token, {
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
