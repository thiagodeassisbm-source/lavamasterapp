
'use client';

import Link from 'next/link';
import { UserPlus, Settings, Users } from 'lucide-react';
import MobileMenu from '@/lib/presentation/components/MobileMenu';

export default function ConfiguracoesPage() {
    return (
        <div className="flex min-h-screen">
            <MobileMenu />
            <main className="flex-1 lg:ml-72 bg-slate-950">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
                    <p className="text-slate-400 mb-8">Gerencie as configurações do sistema</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Card Usuários */}
                        <Link
                            href="/configuracoes/usuarios/novo"
                            className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:bg-slate-800 transition-all hover:scale-[1.02] cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                <UserPlus className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Cadastrar Usuário</h2>
                            <p className="text-slate-400 text-sm">
                                Crie novos usuários para acesso ao sistema.
                            </p>
                        </Link>

                        {/* Card Download App */}
                        <Link
                            href="/configuracoes/download"
                            className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:bg-slate-800 transition-all hover:scale-[1.02] cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                                <Settings className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Instalar App & Robô</h2>
                            <p className="text-slate-400 text-sm">
                                Baixe o aplicativo para Android, iOS ou PC.
                            </p>
                        </Link>

                    </div>
                </div>
            </main>
        </div>
    );
}
