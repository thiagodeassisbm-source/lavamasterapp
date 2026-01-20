
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient(); // REMOVIDO

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const { nome, email, senha, role, ativo } = data;

        // Verifica se usuário existe
        const existingUser = await prisma.usuario.findUnique({
            where: { id: id }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Prepara dados de update
        const updateData: any = {
            nome,
            email,
            role,
            ativo
        };

        // Só atualiza senha se fornecida
        if (senha && senha.trim() !== '') {
            updateData.senha = await bcrypt.hash(senha, 10);
        }

        // Verifica email duplicado (se mudou o email)
        if (email !== existingUser.email) {
            const emailExists = await prisma.usuario.findFirst({
                where: {
                    email,
                    empresaId: existingUser.empresaId,
                    NOT: {
                        id: id
                    }
                }
            });

            if (emailExists) {
                return NextResponse.json(
                    { error: 'Email já está em uso por outro usuário' },
                    { status: 400 }
                );
            }
        }

        const usuario = await prisma.usuario.update({
            where: { id: id },
            data: updateData,
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                ativo: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json(usuario);

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno ao atualizar usuário' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Verifica se usuário existe
        const existingUser = await prisma.usuario.findUnique({
            where: { id: id }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            );
        }

        // Não permitir excluir o próprio usuário (idealmente verificar token) ou verificar se é o último admin
        // Adiar essa validação complexa por enquanto.

        await prisma.usuario.delete({
            where: { id: id }
        });

        return NextResponse.json({ message: 'Usuário excluído com sucesso' });

    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno ao excluir usuário' },
            { status: 500 }
        );
    }
}
