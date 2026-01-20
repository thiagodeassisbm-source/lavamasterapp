
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient(); // REMOVIDO: Usar instancia global


export async function GET(request: Request) {
    try {
        // Busca usuarios (idealmente filtraria por empresa do usuario logado)
        // Como estamos num contexto simplificado sem auth context aqui ainda, pegamos da primeira empresa ou todos
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                ativo: true,
                createdAt: true,
                // Não retornar senha
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

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { nome, email, senha, role, empresaId } = data;

        // Validações básicas
        if (!nome || !email || !senha) {
            return NextResponse.json(
                { error: 'Nome, email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Tenta encontrar uma empresa se não fornecida (para facilitar testes/desenv)
        let targetEmpresaId = empresaId;
        if (!targetEmpresaId) {
            const empresa = await prisma.empresa.findFirst();
            if (empresa) {
                targetEmpresaId = empresa.id;
            } else {
                // Se não houver empresa, cria uma padrão
                const novaEmpresa = await prisma.empresa.create({
                    data: {
                        nome: "Minha Empresa",
                        cnpj: "00000000000000", // Dummy
                        email: "admin@empresa.com"
                    }
                });
                targetEmpresaId = novaEmpresa.id;
            }
        }

        // Verifica se já existe usuário com este email na empresa
        const existeUsuario = await prisma.usuario.findFirst({
            where: {
                email,
                empresaId: targetEmpresaId
            }
        });

        if (existeUsuario) {
            return NextResponse.json(
                { error: 'Usuário já cadastrado com este email' },
                { status: 400 }
            );
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Cria o usuário
        const usuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: hashedPassword,
                role: role || 'usuario',
                empresaId: targetEmpresaId,
                ativo: true
            }
        });

        // Remove a senha do retorno
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
