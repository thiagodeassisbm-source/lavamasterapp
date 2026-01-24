import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ClientesClient from './ClientesClient';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

async function getClientes() {
    const ctx = await getAuthContext();
    if (!ctx || !ctx.empresaId) {
        return null;
    }

    const clientes = await prisma.cliente.findMany({
        where: {
            empresaId: ctx.empresaId,
            ativo: true
        },
        include: {
            veiculos: true
        },
        orderBy: {
            nome: 'asc'
        }
    });

    return JSON.parse(JSON.stringify(clientes)); // Serializa para evitar erros de data
}

export default async function ClientesPage() {
    const clientes = await getClientes();

    if (clientes === null) {
        redirect('/login');
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando lista de clientes...</div>}>
            <ClientesClient initialClientes={clientes} />
        </Suspense>
    );
}
