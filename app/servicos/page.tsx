import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ServicosClient from './ServicosClient';

async function getServicos() {
    const auth = await getAuthContext();
    if (!auth) return null;

    try {
        const data = await prisma.servico.findMany({
            where: {
                empresaId: auth.empresaId,
                status: 'ativo'
            },
            orderBy: { nome: 'asc' }
        });

        return data.map(item => ({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao || undefined,
            preco: item.preco,
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
