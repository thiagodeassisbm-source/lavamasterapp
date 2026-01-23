import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
    const results = [];

    const PASS = "Z4PKLWQY8J9gF6Kp";
    const HOST = "aws-0-sa-east-1.pooler.supabase.com";
    const TENANT = "bkhtemypttswlkluaort";

    // Variação A: Usuário Simples
    const v1 = `postgres://postgres:${PASS}@${HOST}:6543/postgres?pgbouncer=true&connection_limit=1`;

    // Variação B: Usuário.Tenant (padrão) - com 'sslmode=require' explícito
    const v2 = `postgres://postgres.${TENANT}:${PASS}@${HOST}:6543/postgres?sslmode=require&pgbouncer=true`;

    // Variação C: Usuário.Tenant com banco 'postgres' repetido no user (hack antigo)
    const v3 = `postgres://postgres.${TENANT}:${PASS}@${HOST}:6543/${TENANT}?pgbouncer=true`;

    async function testConnection(name: string, url: string) {
        let status = 'pending';
        let detail = '';

        try {
            const client = new PrismaClient({
                datasources: { db: { url } },
                log: []
            });

            const count = await Promise.race([
                client.usuario.count(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 5s')), 5000))
            ]);

            await client.$disconnect();
            status = 'SUCCESS';
            detail = `CONECTADO! Count: ${count}`;
        } catch (e: any) {
            status = 'FAILED';
            detail = e.message || JSON.stringify(e);
        }
        return { name, status, detail, url_masked: url.replace(/:[^:]+@/, ':***@') };
    }

    results.push(await testConnection('1. User=postgres', v1));
    results.push(await testConnection('2. User=postgres.tenant + SSL Require', v2));
    results.push(await testConnection('3. Banco=tenant', v3));

    return (
        <div className="p-10 font-mono text-sm max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center">Diagnóstico Final: Credenciais Pooler</h1>

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

            <div className="mt-8 text-center">
                <p className="text-gray-600 mb-2">Se todos falharem com "Tenant or user not found", copie a Connection String do painel Supabase.</p>
                <a
                    href={`https://supabase.com/dashboard/project/${TENANT}/settings/database`}
                    target="_blank"
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Ir para Supabase Database Settings
                </a>
            </div>
        </div>
    );
}
