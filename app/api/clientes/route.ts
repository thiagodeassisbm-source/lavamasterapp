import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper de Auth
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

export async function GET(request: Request) {
    try {
        const ctx = await getContext();
        if (!ctx) {
            // Se não autenticado, fallback (temporario) ou erro.
            // Para manter compatibilidade com front atual que talvez não mande cookie em fetch server side:
            // Tenta pegar da primeira empresa
            // return NextResponse.json([], { status: 401 }); 
        }

        const where = ctx ? { empresaId: ctx.empresaId } : {};

        const clientes = await prisma.cliente.findMany({
            where,
            include: { veiculos: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(clientes);
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar clientes no banco' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const ctx = await getContext();

        // Fallback de empresa se não tiver contexto
        let targetEmpresaId = ctx?.empresaId;
        if (!targetEmpresaId) {
            const emp = await prisma.empresa.findFirst();
            targetEmpresaId = emp?.id;
        }

        if (!targetEmpresaId) {
            return NextResponse.json({ error: 'Empresa não identificada' }, { status: 400 });
        }

        const { veiculos, ...clienteData } = data;

        // Cria Cliente + Veiculos
        const novoCliente = await prisma.cliente.create({
            data: {
                empresaId: targetEmpresaId,
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

        return NextResponse.json(novoCliente);

    } catch (error: any) {
        console.error('Erro ao criar cliente:', error);
        return NextResponse.json(
            { error: `Erro ao salvar no banco: ${error.message}` },
            { status: 500 }
        );
    }
}
