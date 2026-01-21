import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const usuarios = await prisma.usuario.findMany({
            where: { empresaId: ctx.empresaId },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                ativo: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(usuarios);

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return NextResponse.json(
            { error: 'Erro interno ao listar usuários' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Apenas admin pode criar outros usuários na empresa
        if (ctx.role !== 'admin' && ctx.role !== 'gerente') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const data = await request.json();
        const { nome, email, senha, role } = data;

        if (!nome || !email || !senha) {
            return NextResponse.json(
                { error: 'Nome, email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Verifica se já existe usuário com este email na empresa
        const existeUsuario = await prisma.usuario.findFirst({
            where: {
                email,
                empresaId: ctx.empresaId
            }
        });

        if (existeUsuario) {
            return NextResponse.json(
                { error: 'Usuário já cadastrado com este email nesta empresa' },
                { status: 400 }
            );
        }

        // VERIFICAÇÃO DE LIMITE DO PLANO
        const empresa = await prisma.empresa.findUnique({
            where: { id: ctx.empresaId },
            include: {
                _count: {
                    select: { usuarios: true }
                }
            }
        });

        if (empresa) {
            // @ts-ignore
            if (empresa.limiteUsuarios > 0 && empresa._count.usuarios >= empresa.limiteUsuarios) {
                return NextResponse.json(
                    // @ts-ignore
                    { error: `Limite de usuários atingido. Seu plano permite apenas ${empresa.limiteUsuarios} usuários.` },
                    { status: 403 }
                );
            }
        }

        const hashedPassword = await bcrypt.hash(senha, 10);

        const usuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: hashedPassword,
                role: role || 'usuario',
                empresaId: ctx.empresaId,
                ativo: true
            }
        });

        const { senha: _, ...usuarioSemSenha } = usuario;

        return NextResponse.json(usuarioSemSenha, { status: 201 });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno ao criar usuário' },
            { status: 500 }
        );
    }
}
