import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
    let status = 'loading';
    let message = '';
    let errorDetail = '';
    let envCheck = '';

    try {
        const start = Date.now();
        // Tenta uma query simples
        const count = await prisma.usuario.count();
        const duration = Date.now() - start;

        status = 'success';
        message = `✅ CONEXÃO BEM SUCEDIDA!`;
        errorDetail = `Usuários encontrados: ${count}. Tempo de resposta: ${duration}ms`;

    } catch (err: any) {
        status = 'error';
        message = '❌ ERRO DE CONEXÃO COM O BANCO';
        errorDetail = err.message || JSON.stringify(err);
    }

    // Verificar ENV (sem mostrar senha)
    const dbUrl = process.env.DATABASE_URL || 'NÃO DEFINIDA';
    const isPooler = dbUrl.includes('pooler');
    const isDirect = dbUrl.includes('supabase.co') && !dbUrl.includes('pooler');

    envCheck = `URL Configurada: ${isPooler ? 'POOLER (6543)' : isDirect ? 'DIRETA (5432)' : 'OUTRA/DESCONHECIDA'}`;

    return (
        <div className="p-10 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-4">Teste de Diagnóstico de Banco de Dados</h1>

            <div className={`p-4 rounded mb-4 ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <h2 className="font-bold">{message}</h2>
                <p className="mt-2 text-xs break-all">{errorDetail}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h3 className="font-bold mb-2">Configuração Detectada:</h3>
                <p>{envCheck}</p>
                <p>NODE_ENV: {process.env.NODE_ENV}</p>
            </div>
        </div>
    );
}
