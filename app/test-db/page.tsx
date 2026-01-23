import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function TestDbPage() {
    const results = [];

    // URL 1: Conexão Direta (5432)
    const directUrl = "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@db.bkhtemypttswlkluaort.supabase.co:5432/postgres?connect_timeout=10";

    // URL 2: Conexão Pooler (6543) - Recomendada para Serverless
    const poolerUrl = "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10";

    async function testConnection(name: string, url: string) {
        let status = 'pending';
        let detail = '';
        const start = Date.now();

        try {
            // Instanciar cliente isolado para este teste
            const client = new PrismaClient({
                datasources: { db: { url } },
                log: []
            });

            // Tentar conectar e contar
            await client.usuario.count();
            await client.$disconnect();

            status = 'SUCCESS';
            detail = `${Date.now() - start}ms`;
        } catch (e: any) {
            status = 'FAILED';
            detail = e.message || JSON.stringify(e);
        }
        return { name, status, detail, url_masked: url.replace(/:[^:]+@/, ':***@') };
    }

    results.push(await testConnection('DIRECT (Port 5432)', directUrl));
    results.push(await testConnection('POOLER (Port 6543)', poolerUrl));

    return (
        <div className="p-10 font-mono text-sm max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conexão Vercel -&gt; Supabase</h1>

            <div className="space-y-4">
                {results.map((res, i) => (
                    <div key={i} className={`p-4 rounded border ${res.status === 'SUCCESS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-lg">{res.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${res.status === 'SUCCESS' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                {res.status}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{res.url_masked}</div>
                        <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border overflow-x-auto">
                            {res.detail}
                        </pre>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded">
                <p><strong>Ambiente:</strong> {process.env.NODE_ENV}</p>
                <p><strong>Region:</strong> {process.env.VERCEL_REGION || 'N/A'}</p>
            </div>
        </div>
    );
}
