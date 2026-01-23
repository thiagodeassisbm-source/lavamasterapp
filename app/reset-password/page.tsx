'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password: formData.password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao redefinir senha');
            }

            setIsSuccess(true);
            toast.success('Senha alterada com sucesso!');

            // Redirect after 3 seconds
            setTimeout(() => {
                router.push('/');
            }, 3000);

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

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center text-white">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
                    <p className="text-slate-400">O link de redefinição é inválido ou expirou.</p>
                    <button onClick={() => router.push('/')} className="mt-6 text-blue-400 hover:underline">Voltar ao Login</button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Animated Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
            </div>

            <div className={`w-full max-w-md backdrop-blur-xl bg-slate-900/60 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden z-10 transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />

                <div className="relative z-10">

                    <div className="text-center space-y-4 mb-8">
                        <h1 className="text-3xl font-bold text-white">Nova Senha</h1>
                        <p className="text-slate-400 text-sm">
                            Crie uma nova senha segura para sua conta.
                        </p>
                    </div>

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="space-y-4">
                                <div className="space-y-2 group/input">
                                    <label className="text-sm font-medium text-slate-400 group-focus-within/input:text-indigo-400 transition-colors">Nova Senha</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group/input">
                                    <label className="text-sm font-medium text-slate-400 group-focus-within/input:text-indigo-400 transition-colors">Confirmar Senha</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-500/20 transform transition-all duration-200 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Redefinir Senha</span>
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
                                <h3 className="text-xl font-semibold text-white">Senha Atualizada!</h3>
                                <p className="text-slate-400 text-sm">
                                    Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/')}
                                className="inline-flex py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-sm font-medium"
                            >
                                Ir para Login agora
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
