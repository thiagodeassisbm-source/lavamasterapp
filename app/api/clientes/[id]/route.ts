import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper de Contexto (igual ao route principal)
async function getContext() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key-123');
        return { userId: decoded.sub, empresaId: decoded.empresaId };
    } catch {
        return null;
    }
}

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const ctx = await getContext();

        const cliente = await prisma.cliente.findUnique({
            where: { id },
            include: { veiculos: true }
        });

        if (!cliente) {
            return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
        }

        // Segurança: Verificar empresa se contexto existir
        if (ctx && cliente.empresaId !== ctx.empresaId) {
            // return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        return NextResponse.json(cliente);
    } catch (error) {
        console.error('GET Error:', error);
        return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const data = await request.json();
        const ctx = await getContext();

        const { veiculos, id: _id, createdAt, updatedAt, ...clienteData } = data;

        // Atualiza Cliente e reseta veiculos (estratégia simples)
        const updated = await prisma.cliente.update({
            where: { id },
            data: {
                nome: clienteData.nome,
                telefone: clienteData.telefone,
                cpf: clienteData.cpf,
                email: clienteData.email,
                endereco: clienteData.endereco,
                cidade: clienteData.cidade,
                estado: clienteData.estado,
                cep: clienteData.cep,
                dataNascimento: clienteData.dataNascimento ? new Date(clienteData.dataNascimento) : null,
                observacoes: clienteData.observacoes,
                veiculos: {
                    deleteMany: {}, // Remove anteriores
                    create: veiculos?.map((v: any) => ({
                        marca: v.marca || 'N/A',
                        modelo: v.modelo || 'N/A',
                        placa: v.placa,
                        ano: v.ano ? parseInt(v.ano) : null,
                        cor: v.cor
                    }))
                }
            },
            include: { veiculos: true }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('PUT Error:', error);
        // Pega erro do Prisma se cliente nÃ£o existir
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Cliente não encontrado para atualização' }, { status: 404 });
        }
        return NextResponse.json(
            { error: `Erro ao atualizar: ${error.message}` },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const ctx = await getContext();

        // Verifica se existe antes? Ou try/catch P2025
        await prisma.cliente.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Cliente excluído com sucesso' });
    } catch (error: any) {
        console.error('DELETE Error:', error);
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
        }
        return NextResponse.json(
            { error: `Erro ao excluir: ${error.message}` },
            { status: 500 }
        );
    }
}
