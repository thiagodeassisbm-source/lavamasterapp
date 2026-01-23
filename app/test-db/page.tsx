import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
    const results = [];

    // Senha e Host
    const PASS = "Z4PKLWQY8J9gF6Kp";
    const HOST_POOLER = "aws-0-sa-east-1.pooler.supabase.com"; // Endereço Pooler
    const HOST_DIRECT = "db.bkhtemypttswlkluaort.supabase.co"; // Endereço Direto
    const TENANT = "bkhtemypttswlkluaort";

    // VARIAÇÃO 1: Usuário Padrão (Falhou antes com 'Tenant or user not found')
    // postgres.TENANT
    const v1 = `postgres://postgres.${TENANT}:${PASS}@${HOST_POOLER}:6543/postgres?pgbouncer=true&connection_limit=1`;

    // VARIAÇÃO 2: Alias de Usuário (Alguns poolers pedem esse formato)
    // postgres (apenas)
    const v2 = `postgres://postgres:${PASS}@${HOST_DIRECT}:6543/postgres?pgbouncer=true&connection_limit=1`;

    // VARIAÇÃO 3: Tentar conectar no host direto MAS na porta 5432 (que falhou) usando IPv4 fixo se possível? 
    // Não temos o IP. Vamos tentar o host direto na porta 5432 de novo mas com connect_timeout bem alto.
    const v3 = `postgres://postgres.${TENANT}:${PASS}@${HOST_DIRECT}:5432/postgres?connect_timeout=30`;

    // VARIAÇÃO 4: Formato Alternativo de Host
    // db.TENANT.supabase.co na porta 6543 (Muitos projetos usam esse DNS para o pooler também)
    const v4 = `postgres://postgres.${TENANT}:${PASS}@${HOST_DIRECT}:6543/postgres?pgbouncer=true`;

    async function testConnection(name: string, url: string) {
        let status = 'pending';
        let detail = '';
        const start = Date.now();

        try {
            const client = new PrismaClient({
                datasources: { db: { url } },
                log: []
            });

            // Timeout de 10s
            const count = await Promise.race([
                client.usuario.count(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 10s')), 10000))
            ]);

            await client.$disconnect();
            status = 'SUCCESS';
            detail = `OK! ${Date.now() - start}ms | Count: ${count}`;
        } catch (e: any) {
            status = 'FAILED';
            detail = e.message || JSON.stringify(e);
        }
        return { name, status, detail, url_masked: url.replace(/:[^:]+@/, ':***@') };
    }

    results.push(await testConnection('1. Pooler AWS Standard', v1));
    results.push(await testConnection('2. Host Direct na Porta 6543', v2)); // Testando se o host db. aceita 6543
    results.push(await testConnection('3. Direct 5432 (Retry)', v3));
    results.push(await testConnection('4. Host Direct na 6543 (User Full)', v4));

    return (
        <div className="p-10 font-mono text-sm max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center">Diagnóstico Credenciais Supabase</h1>

            <div className="space-y-4">
                {results.map((res, i) => (
                    <div key={i} className={`p-4 rounded border shadow-sm ${res.status === 'SUCCESS' ? 'bg-green-100 border-green-400' : 'bg-white border-gray-300'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-lg">{res.name}</span>
                            <span className={`px-3 py-1 rounded text-xs font-bold ${res.status === 'SUCCESS' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {res.status}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mb-2 font-mono break-all">{res.url_masked}</div>
                        <pre className="whitespace-pre-wrap text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                            {res.detail}
                        </pre>
                    </div>
                ))}
            </div>
            <p className="mt-4 text-center text-xs text-gray-500">Se o erro for "Tenant or user not found", o problema é usuário/senha/projeto inexistente. Se for "Can't reach", é bloqueio de rede.</p>
        </div>
    );
}
