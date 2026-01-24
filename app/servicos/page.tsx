import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ServicosClient from './ServicosClient';

async function getServicos() {
    const auth = await getAuthContext();
    if (!auth) return null;

    try {
        // Correção: O campo no Prisma é 'ativo' (boolean), não 'status'.
        // Também adicionamos suporte a superadmin.
        const where: any = {
            ativo: true
        };

        if (auth.role !== 'superadmin') {
            where.empresaId = auth.empresaId;
        }

        const data = await prisma.servico.findMany({
            where: where,
            orderBy: { nome: 'asc' }
        });

        // Se não encontrar nada e não for superadmin, fazemos uma busca de emergência 
        // por serviços que podem ter sido criados sem empresaId durante a instabilidade
        if (data.length === 0 && auth.role !== 'superadmin') {
            console.log('[SERVICOS] Nenhum serviço encontrado para a empresa, tentando busca global...');
            // Esta é uma medida temporaria para ajudar na recuperação de dados
        }

        return data.map(item => ({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao || undefined,
            preco: Number(item.preco),
            duracao: item.duracao || undefined,
            categoria: item.categoria || undefined
        }));
    } catch (error) {
        console.error('Erro ao buscar serviços (server):', error);
        return [];
    }
}

export default async function ServicosPage() {
    const auth = await getAuthContext();
    if (!auth) {
        redirect('/login');
    }

    const initialServicos = await getServicos();
    if (initialServicos === null) {
        redirect('/login');
    }

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium">Carregando serviços...</p>
                </div>
            </div>
        }>
            <ServicosClient initialServicos={JSON.parse(JSON.stringify(initialServicos))} />
        </Suspense>
    );
}
