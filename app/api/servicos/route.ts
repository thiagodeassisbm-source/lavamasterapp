import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Se for superadmin, pode ver tudo ou filtrar por empresa
        const { searchParams } = new URL(request.url);
        const filterEmpresaId = searchParams.get('empresaId');

        const where: any = { ativo: true };

        if (ctx.role !== 'superadmin') {
            where.empresaId = ctx.empresaId;
        } else if (filterEmpresaId) {
            where.empresaId = filterEmpresaId;
        }

        const servicos = await prisma.servico.findMany({
            where: where,
            orderBy: {
                nome: 'asc'
            }
        });

        return NextResponse.json(servicos);
    } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar serviços' },
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

        const data = await request.json();

        // Se for superadmin, pode vir no body, senão usa o do contexto
        const empresaId = (ctx.role === 'superadmin' ? data.empresaId : ctx.empresaId) || ctx.empresaId;

        if (!empresaId) {
            return NextResponse.json({ error: 'EmpresaId é obrigatório' }, { status: 400 });
        }

        const novoServico = await prisma.servico.create({
            data: {
                empresaId: empresaId,
                nome: data.nome,
                descricao: data.descricao,
                preco: parseFloat(data.preco) || 0,
                duracao: parseInt(data.duracao) || 30,
                categoria: data.categoria,
                ativo: true
            }
        });

        return NextResponse.json(novoServico);

    } catch (error: any) {
        console.error('Erro ao salvar serviço:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
