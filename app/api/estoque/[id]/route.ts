import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    context: any
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const params = await context.params;
        const id = params.id;
        const data = await request.json();

        console.log(`[ESTOQUE] Tentativa de update ID: ${id} para Empresa: ${ctx.empresaId}`);

        if (!id) {
            return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
        }

        // Primeiro, verificar se o produto existe de fato (independente da empresa) para debug
        const produtoExistenteGlobal = await prisma.produto.findUnique({
            where: { id: id }
        });

        if (!produtoExistenteGlobal) {
            console.log(`[ESTOQUE] Produto ${id} não existe no banco de dados.`);
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }

        // Agora verificar se pertence à empresa do contexto
        if (ctx.role !== 'superadmin' && produtoExistenteGlobal.empresaId !== ctx.empresaId) {
            console.log(`[ESTOQUE] Acesso negado! Produto pertence à empresa ${produtoExistenteGlobal.empresaId}, mas usuário é da empresa ${ctx.empresaId}`);
            return NextResponse.json({ error: 'Sem permissão para editar este produto' }, { status: 403 });
        }

        const produto = produtoExistenteGlobal;

        const updatedProduto = await prisma.produto.update({
            where: { id: id },
            data: {
                nome: data.nome,
                descricao: data.descricao,
                codigo: data.codigo,
                preco: data.preco !== undefined ? parseFloat(data.preco) : undefined,
                custo: data.custo !== undefined ? parseFloat(data.custo) : undefined,
                estoque: data.estoque !== undefined ? parseInt(data.estoque) : undefined,
                estoqueMin: data.estoqueMin !== undefined ? parseInt(data.estoqueMin) : undefined,
                unidade: data.unidade,
                categoria: data.categoria,
                ativo: data.ativo !== undefined ? data.ativo : undefined
            }
        });

        return NextResponse.json(updatedProduto);

    } catch (error: any) {
        console.error('Erro ao atualizar produto:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: any
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const params = await context.params;
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
        }

        const produto = await prisma.produto.findFirst({
            where: {
                id: id,
                empresaId: ctx.empresaId || undefined
            }
        });

        if (!produto) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }

        await prisma.produto.delete({
            where: { id: id }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Erro ao excluir produto:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
