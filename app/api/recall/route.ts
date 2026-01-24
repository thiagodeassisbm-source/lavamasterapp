import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const empresaId = ctx.empresaId;

        // Fetch clients with their LAST completed appointment
        const clientes = await prisma.cliente.findMany({
            where: {
                empresaId: empresaId as string,
                ativo: true
            },
            include: {
                veiculos: true,
                agendamentos: {
                    orderBy: {
                        dataHora: 'desc'
                    },
                    take: 1,
                    include: {
                        servicos: {
                            include: {
                                servico: true
                            }
                        }
                    }
                }
            }
        });

        const now = new Date();

        const recallList = clientes
            .map(c => {
                const lastApp = c.agendamentos.length > 0 ? c.agendamentos[0] : null;
                let lastDate = lastApp ? new Date(lastApp.dataHora) : new Date(c.createdAt);

                const diffTime = now.getTime() - lastDate.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const veiculosStr = c.veiculos.map(v => v.modelo).join(', ') || 'Sem veículo';

                return {
                    id: c.id,
                    nome: c.nome,
                    telefone: c.telefone,
                    veiculo: veiculosStr,
                    ultimaVisita: lastDate.toISOString(),
                    servicos: lastApp ? lastApp.servicos.map(s => s.servico?.nome || 'Serviço').join(', ') : 'Cadastro',
                    diasAusente: diffDays
                };
            })
            .sort((a, b) => b.diasAusente - a.diasAusente);

        return NextResponse.json(recallList);

    } catch (error) {
        console.error('Erro ao buscar recall:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
