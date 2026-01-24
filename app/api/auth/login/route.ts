import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro-lava-master-2026';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const sanitizedEmail = email?.trim().toLowerCase();
        console.log(`[AUTH] Tentativa de login para: ${sanitizedEmail}`);

        if (!sanitizedEmail || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        const usuario = await prisma.usuario.findFirst({
            where: { email: sanitizedEmail }
        });

        if (!usuario) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Lockout
        if (usuario.lockoutUntil) {
            const now = new Date();
            if (now < usuario.lockoutUntil) {
                return NextResponse.json(
                    { error: 'Conta bloqueada temporariamente. Tente mais tarde.' },
                    { status: 429 }
                );
            } else {
                await prisma.usuario.update({
                    where: { id: usuario.id },
                    data: { failedLoginAttempts: 0, lockoutUntil: null }
                });
            }
        }

        const senhaValida = await bcrypt.compare(password, usuario.senha);

        if (!senhaValida) {
            const newAttempts = (usuario.failedLoginAttempts || 0) + 1;
            let updateData: any = { failedLoginAttempts: newAttempts };
            if (newAttempts >= MAX_ATTEMPTS) {
                updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_TIME_MS);
            }
            await prisma.usuario.update({ where: { id: usuario.id }, data: updateData });

            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        // Se não for superadmin, validar empresa
        if (usuario.role !== 'superadmin') {
            const empresa = await prisma.empresa.findUnique({ where: { id: usuario.empresaId as string } });
            if (!empresa || !empresa.ativo || empresa.bloqueado) {
                return NextResponse.json({ error: 'Acesso da empresa suspenso ou inativo.' }, { status: 403 });
            }
            if (empresa.dataExpiracao && new Date() > new Date(empresa.dataExpiracao)) {
                return NextResponse.json({ error: 'Assinatura expirada.' }, { status: 403 });
            }
        }

        // Login Sucesso
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { failedLoginAttempts: 0, lockoutUntil: null }
        });

        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                role: usuario.role,
                empresaId: usuario.empresaId ?? null
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const { senha: _, ...usuarioSemSenha } = usuario;

        const response = NextResponse.json({
            token,
            user: usuarioSemSenha,
            redirect: usuario.role === 'superadmin' ? '/superadmin/dashboard' : '/dashboard'
        });

        // Cookie Principal (Padrão moderno com underline)
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: true, // Força secure pois você está usando HTTPS no domínio .com.br
            sameSite: 'lax',
            path: '/',
            maxAge: 86400 // 24 horas
        });

        // Cookie de Compatibilidade (Padrão antigo com hífen)
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 86400
        });

        return response;

    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
