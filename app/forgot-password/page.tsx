'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [email, setEmail] = useState('');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao solicitar recuperação');
            }

            setIsSubmitted(true);
            toast.success('Link de recuperação enviado com sucesso!');

        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erro ao conectar com o servidor');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Animated Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
            </div>

            <div className={`w-full max-w-md backdrop-blur-xl bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden z-10 transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 pointer-events-none" />

                <div className="relative z-10">

                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Voltar para Login
                    </button>

                    <div className="text-center space-y-4 mb-8">
                        <h1 className="text-3xl font-bold text-white">Recuperar Senha</h1>
                        <p className="text-slate-400 text-sm">
                            Insira seu email cadastrado e enviaremos um link para você redefinir sua senha.
                        </p>
                    </div>

                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 group/input">
                                <label className="text-sm font-medium text-slate-400 group-focus-within/input:text-blue-400 transition-colors">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-slate-500 group-focus-within/input:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-500/20 transform transition-all duration-200 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Enviar Link</span>
                                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-500/10">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-white">Email Enviado!</h3>
                                <p className="text-slate-400 text-sm">
                                    Verifique sua caixa de entrada (e spam) para encontrar o link de redefinição.
                                </p>
                            </div>
                            <p className="text-xs text-slate-500">
                                Não recebeu? <button onClick={() => setIsSubmitted(false)} className="text-blue-400 hover:underline">Tentar novamente</button>
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
