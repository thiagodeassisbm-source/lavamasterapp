'use client';

import { useState, useEffect } from 'react';
import { Save, MessageSquare, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MensagensPage() {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const res = await fetch('/api/configuracoes/mensagens');
                if (res.ok) {
                    const data = await res.json();
                    setMessage(data.message || getDefaultMessage());
                }
            } catch (error) {
                console.error('Erro ao carregar mensagem:', error);
                toast.error('Erro ao carregar configuração.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessage();
    }, []);

    const getDefaultMessage = () => {
        return "Olá *{cliente}*! Aqui é da Estética Automotiva.\nGostaria de confirmar seu agendamento para *{data}* às *{hora}*.\nPodemos confirmar?";
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/configuracoes/mensagens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (res.ok) {
                toast.success('Modelo de mensagem salvo!');
            } else {
                toast.error('Erro ao salvar.');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro de conexão.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="w-full p-4 lg:p-8">
            <div className="space-y-8 animate-slide-up">
                {/* Header */}
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Mensagens do WhatsApp</h1>
                        <p className="text-slate-400">Configure o modelo de mensagem automática de confirmação de agendamento.</p>
                    </div>
                </div>

                {/* Content Grid - No Max Width */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Information Card */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Info className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-blue-300 text-lg mb-1">Dica de Personalização</h3>
                            <p className="text-slate-400 leading-relaxed mb-4">
                                Use as variáveis abaixo no seu texto para que o sistema preencha automaticamente os dados do agendamento antes de enviar:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <code className="px-3 py-1.5 rounded-lg bg-black/40 text-yellow-400 font-mono text-sm border border-white/5">{'{cliente}'}</code>
                                <code className="px-3 py-1.5 rounded-lg bg-black/40 text-yellow-400 font-mono text-sm border border-white/5">{'{data}'}</code>
                                <code className="px-3 py-1.5 rounded-lg bg-black/40 text-yellow-400 font-mono text-sm border border-white/5">{'{hora}'}</code>
                                <code className="px-3 py-1.5 rounded-lg bg-black/40 text-yellow-400 font-mono text-sm border border-white/5">{'{servico}'}</code>
                            </div>
                        </div>
                    </div>

                    {/* Editor Card */}
                    <div className="glass-effect rounded-3xl p-8 border border-white/10 shadow-2xl">
                        <label className="block text-lg font-bold text-white mb-4">
                            Texto da Mensagem
                        </label>

                        {isLoading ? (
                            <div className="h-64 w-full animate-pulse bg-white/5 rounded-2xl" />
                        ) : (
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full h-80 p-6 rounded-2xl bg-black/20 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-lg leading-relaxed shadow-inner"
                                placeholder="Digite sua mensagem aqui..."
                            />
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        SALVANDO...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        SALVAR CONFIGURAÇÃO
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
