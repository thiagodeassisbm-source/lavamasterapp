
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DebugPage() {
    const [dbStatus, setDbStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkDb = async () => {
        setLoading(true);
        setDbStatus(null);
        try {
            const res = await fetch('/api/debug');
            // Tenta ler texto primeiro para ver se não é HTML de erro
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                setDbStatus({ success: res.ok, data: json, raw: text });
            } catch (e) {
                setDbStatus({ success: false, error: 'Resposta não é JSON válido', raw: text });
            }
        } catch (err) {
            setDbStatus({ success: false, error: String(err) });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkDb();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-mono">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-blue-400">Sistema Debug & Diagnóstico</h1>
                    <Link href="/configuracoes/usuarios/novo" className="text-sm underline text-slate-400">Voltar</Link>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        1. Teste de Conexão com Banco de Dados
                        <button
                            onClick={checkDb}
                            className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500"
                            disabled={loading}
                        >
                            {loading ? 'Verificando...' : 'Retestar'}
                        </button>
                    </h2>

                    {loading && <p className="text-yellow-400 animate-pulse">Testando conexão...</p>}

                    {!loading && dbStatus && (
                        <div className={`p-4 rounded-lg bg-black/50 border ${dbStatus.success ? 'border-green-500/30' : 'border-red-500/30'}`}>
                            <div className="mb-2">
                                <span className={`font-bold ${dbStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {dbStatus.success ? 'CONEXÃO SUCESSO' : 'ERRO DE CONEXÃO'}
                                </span>
                            </div>

                            {dbStatus.data && (
                                <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(dbStatus.data, null, 2)}
                                </pre>
                            )}

                            {dbStatus.raw && !dbStatus.data && (
                                <div className="mt-2">
                                    <p className="text-red-300 text-xs mb-1">Recebido HTML ou Texto Inválido:</p>
                                    <iframe
                                        title="preview"
                                        srcDoc={dbStatus.raw}
                                        className="w-full h-64 bg-white rounded border-none"
                                    />
                                </div>
                            )}

                            {dbStatus.error && (
                                <p className="text-red-400 text-sm mt-2">{dbStatus.error}</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">2. Sugestões de Correção</h2>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
                        <li>
                            Se aparecer <strong>"PrismaClientInitializationError"</strong>: Significa que o banco de dados não foi encontrado ou a URL no `.env` está errada.
                        </li>
                        <li>
                            Se aparecer <strong>HTML (Página de Erro)</strong>: Pode ser um erro de servidor (500) não tratado ou problema no Next.js.
                        </li>
                        <li>
                            Certifique-se de ter rodado <code>npx prisma generate</code> e <code>npx prisma db push</code> recentemente.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
