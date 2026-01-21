import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // @ts-ignore: O client ainda não foi regenerado, mas a tabela existe
        const planos = await prisma.plano.findMany({
            orderBy: { preco: 'asc' } // Ordenar por preço padrão
        });
        return NextResponse.json(planos);
    } catch (error) {
        console.error('Erro ao listar planos:', error);
        return NextResponse.json({ error: 'Erro ao listar planos' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Verificar se prisma.plano existe (runtime check)
        // @ts-ignore
        if (!prisma.plano) {
            console.error('CRÍTICO: prisma.plano é undefined. Necessário rodar npx prisma generate.');
            return NextResponse.json({ error: 'Erro de Servidor: Modelo de Banco de Dados não sincronizado. Contate o suporte.' }, { status: 500 });
        }

        // Validação básica dos dados recebidos
        if (!data.nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const preco = Number(data.preco);
        if (isNaN(preco)) {
            return NextResponse.json({ error: 'Preço inválido' }, { status: 400 });
        }

        // @ts-ignore
        const novoPlano = await prisma.plano.create({
            data: {
                nome: data.nome,
                descricao: data.descricao,
                preco: preco,
                intervalo: data.intervalo || 'MENSAL',
                limiteUsuarios: Number(data.limiteUsuarios) || 1,
                limiteClientes: Number(data.limiteClientes) || 100,
                limiteAgendamentos: Number(data.limiteAgendamentos) || 100,
                duracaoDias: data.duracaoDias ? Number(data.duracaoDias) : null,
                ativo: data.ativo ?? true,
                destaque: data.destaque ?? false
            }
        });

        return NextResponse.json(novoPlano);

    } catch (error: any) {
        console.error('Erro detalhado ao criar plano:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro desconhecido ao processar requisição' },
            { status: 500 }
        );
    }
}
