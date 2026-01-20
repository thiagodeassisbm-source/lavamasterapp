'use client';

import MobileMenu from '@/lib/presentation/components/MobileMenu';
import { Smartphone, Download, Monitor, Share, PlusSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function DownloadPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Detecta OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        setIsAndroid(/android/.test(userAgent));

        // Captura evento de instalação (Chrome/Android/Desktop)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />
            <main className="flex-1 lg:ml-72">
                <div className="p-8">
                    {/* Header com Voltar */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/configuracoes" className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Instalar Aplicativo</h1>
                            <p className="text-slate-400">Tenha o sistema na palma da mão</p>
                        </div>
                    </div>

                    {/* Card Principal (Hero) */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">
                                    Robô de Atendimento & Gestão
                                </h2>
                                <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                                    Instale agora o aplicativo oficial. Com ele você recebe notificações, tem acesso offline
                                    e uma experiência muito mais fluida e rápida.
                                </p>

                                {deferredPrompt ? (
                                    <button
                                        onClick={handleInstallClick}
                                        className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Instalar Agora
                                    </button>
                                ) : (
                                    <div className="text-white/80 bg-black/20 px-4 py-2 rounded-lg inline-block text-sm">
                                        Siga as instruções abaixo para seu dispositivo
                                    </div>
                                )}
                            </div>
                            <div className="hidden md:flex justify-center">
                                <Smartphone className="w-48 h-48 text-white/90 drop-shadow-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Instruções por Plataforma */}
                    <div className="grid md:grid-cols-3 gap-6">

                        {/* Android */}
                        <div className={`p-6 rounded-2xl border ${isAndroid ? 'bg-slate-800 border-green-500/50' : 'bg-slate-900 border-white/5'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Android</h3>
                            </div>
                            <ol className="text-slate-400 space-y-4 list-decimal pl-4">
                                <li>Abra este site no <strong>Google Chrome</strong>.</li>
                                <li>Toque no menu (três pontinhos) no topo.</li>
                                <li>Selecione <strong>"Instalar aplicativo"</strong> ou "Adicionar à tela inicial".</li>
                            </ol>
                        </div>

                        {/* iOS */}
                        <div className={`p-6 rounded-2xl border ${isIOS ? 'bg-slate-800 border-blue-500/50' : 'bg-slate-900 border-white/5'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Share className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white">iPhone (iOS)</h3>
                            </div>
                            <ol className="text-slate-400 space-y-4 list-decimal pl-4">
                                <li>Abra este site no <strong>Safari</strong>.</li>
                                <li>Toque no botão <strong>Compartilhar</strong> <Share className="w-3 h-3 inline" /> na barra inferior.</li>
                                <li>Role para cima e toque em <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="w-3 h-3 inline" />.</li>
                            </ol>
                        </div>

                        {/* Desktop */}
                        <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Monitor className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white">PC / Mac</h3>
                            </div>
                            <ol className="text-slate-400 space-y-4 list-decimal pl-4">
                                <li>No Chrome ou Edge, olhe para a barra de endereço.</li>
                                <li>Clique no ícone de <strong>Instalar</strong> (Monitor com seta) no canto direito.</li>
                                <li>Ou clique nos três pontinhos {'>'} Instalar Estética Auto.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
