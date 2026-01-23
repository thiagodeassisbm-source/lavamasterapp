import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
    const results = [];

    // VARIAÇÃO 1: Pooler Tradicional (6543) com PgBouncer
    const v1 = "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";

    // VARIAÇÃO 2: Pooler Sem SSL (Supabase às vezes precisa disso no modo Transaction)
    const v2 = "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=disable";

    // VARIAÇÃO 3: URL Direta na 5432 (Padrão)
    const v3 = "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@db.bkhtemypttswlkluaort.supabase.co:5432/postgres?connect_timeout=15";

    // VARIAÇÃO 4: URL Direta na 5432 (IPv4 Workaround - tenta resolver DNS pooler na 5432)
    const v4 = "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require";

    async function testConnection(name: string, url: string) {
        let status = 'pending';
        let detail = '';
        const start = Date.now();

        try {
            const client = new PrismaClient({
                datasources: { db: { url } },
                log: [] // silenciar logs para não poluir
            });

            // Timeout de 10s
            const count = await Promise.race([
                client.usuario.count(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Manual Timeout 10s')), 10000))
            ]);

            await client.$disconnect();
            status = 'SUCCESS';
            detail = `Tempo: ${Date.now() - start}ms | Count: ${count}`;
        } catch (e: any) {
            status = 'FAILED';
            detail = e.message || JSON.stringify(e);
        }
        return { name, status, detail, url_masked: url.replace(/:[^:]+@/, ':***@') };
    }

    results.push(await testConnection('1. Pooler (6543) + PGBouncer', v1));
    results.push(await testConnection('2. Pooler (6543) NO SSL', v2));
    results.push(await testConnection('3. Direct (5432) Standard', v3));
    results.push(await testConnection('4. Pooler Host on 5432', v4));

    return (
        <div className="p-10 font-mono text-sm max-w-4xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-center">Diagnóstico Avançado de Conexão</h1>

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

            <p className="text-center mt-10 text-gray-400">Ambiente: {process.env.NODE_ENV}</p>
        </div>
    );
}
