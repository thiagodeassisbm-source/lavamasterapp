'use client';

import { useState, useEffect } from 'react';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
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
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <MobileMenu />
            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                            <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Mensagens do WhatsApp</h1>
                            <p className="text-slate-400">Configure o modelo de mensagem de confirmação de agendamento.</p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="glass-effect rounded-2xl p-6 md:p-8 border border-white/10">
                        <div className="flex items-start gap-4 mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-blue-300 mb-1">Variáveis Disponíveis</h3>
                                <p className="text-sm text-slate-400">
                                    Use estas variáveis no texto para preencher automaticamente com os dados do agendamento:
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <code className="px-2 py-1 rounded bg-black/30 text-yellow-400 text-sm">{'{cliente}'}</code>
                                    <code className="px-2 py-1 rounded bg-black/30 text-yellow-400 text-sm">{'{data}'}</code>
                                    <code className="px-2 py-1 rounded bg-black/30 text-yellow-400 text-sm">{'{hora}'}</code>
                                    <code className="px-2 py-1 rounded bg-black/30 text-yellow-400 text-sm">{'{servico}'}</code>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-300">
                                Modelo da Mensagem
                            </label>

                            {isLoading ? (
                                <div className="h-40 w-full animate-pulse bg-white/5 rounded-xl" />
                            ) : (
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full h-64 p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-sm leading-relaxed"
                                    placeholder="Digite sua mensagem aqui..."
                                />
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Salvar Configuração
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
