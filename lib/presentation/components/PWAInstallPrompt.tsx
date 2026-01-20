'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Verifica se já está instalado
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Escuta o evento beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Mostra o prompt após 30 segundos (ou quando o usuário interagir)
            setTimeout(() => {
                const dismissed = localStorage.getItem('pwa-install-dismissed');
                if (!dismissed) {
                    setShowPrompt(true);
                }
            }, 30000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detecta quando o app é instalado
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Mostra o prompt de instalação
        deferredPrompt.prompt();

        // Aguarda a escolha do usuário
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('PWA instalado com sucesso');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Não mostra se já está instalado ou se não deve mostrar
    if (isInstalled || !showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
            <div className="glass-effect rounded-2xl p-6 border border-white/20 shadow-2xl">
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Fechar"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Download className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">
                            Instalar Aplicativo
                        </h3>
                        <p className="text-sm text-slate-300 mb-4">
                            Adicione o app à sua tela inicial para acesso rápido e experiência completa!
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={handleInstallClick}
                                className="
                  flex-1 px-4 py-2 
                  bg-gradient-to-r from-blue-500 to-cyan-500 
                  text-white font-semibold rounded-xl
                  hover:from-blue-600 hover:to-cyan-600
                  transition-all duration-200
                  shadow-lg shadow-blue-500/30
                "
                            >
                                Instalar
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="
                  px-4 py-2 
                  bg-white/5 border border-white/10
                  text-slate-300 font-semibold rounded-xl
                  hover:bg-white/10
                  transition-all duration-200
                "
                            >
                                Agora não
                            </button>
                        </div>
                    </div>
                </div>

                {/* Instruções para iOS */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-400">
                        <strong className="text-slate-300">iOS:</strong> Toque em{' '}
                        <span className="inline-block">
                            <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </span>{' '}
                        e depois em "Adicionar à Tela de Início"
                    </p>
                </div>
            </div>
        </div>
    );
}
