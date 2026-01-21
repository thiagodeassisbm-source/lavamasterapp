'use client';

import MobileMenu from '@/lib/presentation/components/MobileMenu';
import { Smartphone, Download, Monitor, Share, PlusSquare, ArrowLeft, X, MoreVertical, Menu } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function DownloadPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    // Modais de Instrução
    const [showIOSModal, setShowIOSModal] = useState(false);
    const [showAndroidModal, setShowAndroidModal] = useState(false);
    const [showPCModal, setShowPCModal] = useState(false);

    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detecta se já está instalado
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');
        setIsStandalone(isStandaloneMode);

        // Detecta OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
        setIsAndroid(/android/.test(userAgent));

        // Captura evento de instalação (Chrome/Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            console.log('Evento de instalação capturado!');
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleAndroidClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            // Se não tiver prompt automático, abre manual
            setShowAndroidModal(true);
        }
    };

    const handlePCClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            setShowPCModal(true);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />
            <main className="flex-1 lg:ml-72 bg-gradient-to-b from-slate-950 to-slate-900 pb-20">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {/* Header com Voltar */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/configuracoes" className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Download do App</h1>
                            <p className="text-slate-400 text-sm md:text-base">Escolha seu dispositivo para instalar</p>
                        </div>
                    </div>

                    {/* Status de Instalação */}
                    {isStandalone && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-8 flex items-center gap-3 animate-fade-in">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <p className="font-medium">O aplicativo já está instalado neste dispositivo!</p>
                        </div>
                    )}

                    {/* Grid de Opções */}
                    <div className="grid md:grid-cols-3 gap-6">

                        {/* ANDROID CARD */}
                        <div className={`relative group overflow-hidden rounded-2xl p-6 border transition-all duration-300 ${isAndroid ? 'bg-slate-800 border-green-500/50 shadow-green-900/20 shadow-xl scale-105 z-10' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}>
                            {isAndroid && <div className="absolute top-4 right-4 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">SEU DISPOSITIVO</div>}

                            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
                                <Smartphone className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Android</h3>
                            <p className="text-slate-400 mb-8 text-sm h-10">Instalação direta via Google Chrome ou Samsung Internet.</p>

                            <button
                                onClick={handleAndroidClick}
                                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50 cursor-pointer"
                            >
                                <Download className="w-5 h-5" />
                                {deferredPrompt ? 'Instalar Agora' : 'Instalar no Android'}
                            </button>
                        </div>

                        {/* IPHONE (iOS) CARD */}
                        <div className={`relative group overflow-hidden rounded-2xl p-6 border transition-all duration-300 ${isIOS ? 'bg-slate-800 border-blue-500/50 shadow-blue-900/20 shadow-xl scale-105 z-10' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}>
                            {isIOS && <div className="absolute top-4 right-4 text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20">SEU DISPOSITIVO</div>}

                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                                <Share className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">iPhone / iPad</h3>
                            <p className="text-slate-400 mb-8 text-sm h-10">Adicione à Tela de Início via Safari para experiência completa.</p>

                            <button
                                onClick={() => setShowIOSModal(true)}
                                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 transition-all cursor-pointer"
                            >
                                <PlusSquare className="w-5 h-5" />
                                Instalar no iPhone
                            </button>
                        </div>

                        {/* PC / MAC CARD */}
                        <div className="relative group overflow-hidden rounded-2xl p-6 border bg-slate-900 border-white/5 hover:border-white/10 transition-all duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                                <Monitor className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Windows / Mac</h3>
                            <p className="text-slate-400 mb-8 text-sm h-10">Instale como um programa nativo no seu computador.</p>

                            <button
                                onClick={handlePCClick}
                                className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/50 cursor-pointer"
                            >
                                <Download className="w-5 h-5" />
                                {deferredPrompt ? 'Instalar Agora' : 'Instalar no PC'}
                            </button>
                        </div>
                    </div>

                    {/* --- MODAIS DE INSTRUÇÃO --- */}

                    {/* MODAL TUTORIAL iOS */}
                    {showIOSModal && (
                        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowIOSModal(false)}>
                            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 relative animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setShowIOSModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500"><Share className="w-8 h-8" /></div>
                                    <h3 className="text-xl font-bold text-white mb-2">Instalar no iPhone</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="w-8 h-8 flex items-center justify-center bg-blue-500 rounded-full text-white font-bold text-sm shrink-0">1</div>
                                        <p className="text-sm text-slate-300">Toque em <span className="font-bold text-white">Compartilhar</span> <Share className="w-3 h-3 inline mx-1" />.</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="w-8 h-8 flex items-center justify-center bg-blue-500 rounded-full text-white font-bold text-sm shrink-0">2</div>
                                        <p className="text-sm text-slate-300">Toque em <span className="font-bold text-white">Adicionar à Tela de Início</span> <PlusSquare className="w-3 h-3 inline mx-1" />.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL TUTORIAL ANDROID */}
                    {showAndroidModal && (
                        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAndroidModal(false)}>
                            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 relative animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setShowAndroidModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-500"><Smartphone className="w-8 h-8" /></div>
                                    <h3 className="text-xl font-bold text-white mb-2">Instalar no Android</h3>
                                    <p className="text-slate-400 text-sm">Se a instalação automática falhar:</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full text-white font-bold text-sm shrink-0">1</div>
                                        <p className="text-sm text-slate-300">Abra o menu do navegador (três pontinhos <MoreVertical className="w-3 h-3 inline" />).</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full text-white font-bold text-sm shrink-0">2</div>
                                        <p className="text-sm text-slate-300">Selecione <span className="font-bold text-white">"Instalar aplicativo"</span> ou "Adicionar à tela inicial".</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL TUTORIAL PC */}
                    {showPCModal && (
                        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowPCModal(false)}>
                            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 relative animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setShowPCModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500"><Monitor className="w-8 h-8" /></div>
                                    <h3 className="text-xl font-bold text-white mb-2">Instalar no PC / Mac</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="w-8 h-8 flex items-center justify-center bg-purple-500 rounded-full text-white font-bold text-sm shrink-0">1</div>
                                        <p className="text-sm text-slate-300">Olhe para a barra de endereços (onde fica o site).</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <div className="w-8 h-8 flex items-center justify-center bg-purple-500 rounded-full text-white font-bold text-sm shrink-0">2</div>
                                        <p className="text-sm text-slate-300">Clique no ícone de <span className="font-bold text-white">Download/Instalar</span> (computador com seta) no canto direito.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
