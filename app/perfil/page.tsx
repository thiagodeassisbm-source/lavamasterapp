'use client';

import { useState, useEffect } from 'react';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import { User, Mail, Phone, Camera, Save, Shield, ChevronDown } from 'lucide-react';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Toast State
    const [toastOpen, setToastOpen] = useState(false);
    const [toastType, setToastType] = useState<ToastType>('success');
    const [toastMessage, setToastMessage] = useState('');
    const [toastTitle, setToastTitle] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'usuario',
        bio: ''
    });

    // Fetch Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/usuarios/me');
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.nome || '',
                        email: data.email || '',
                        phone: data.telefone || '',
                        role: data.role || 'usuario',
                        bio: data.bio || ''
                    });
                }
            } catch (error) {
                console.error('Erro ao carregar perfil', error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/usuarios/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: formData.name,
                    email: formData.email,
                    telefone: formData.phone,
                    role: formData.role,
                    bio: formData.bio
                })
            });

            if (res.ok) {
                setToastTitle('Sucesso');
                setToastMessage('Perfil atualizado com sucesso!');
                setToastType('success');
            } else {
                const data = await res.json();
                setToastTitle('Erro');
                setToastMessage(data.error || 'Erro ao salvar dados.');
                setToastType('error');
            }
        } catch (error) {
            setToastTitle('Erro');
            setToastMessage('Erro de conexão.');
            setToastType('error');
        } finally {
            setIsLoading(false);
            setToastOpen(true);
        }
    };

    if (isFetching) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;
    }

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />

            <Toast
                isOpen={toastOpen}
                type={toastType}
                title={toastTitle}
                message={toastMessage}
                onClose={() => setToastOpen(false)}
            />

            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                <div className="max-w-6xl mx-auto space-y-4 animate-slide-up">

                    {/* Header with Background */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-xl">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
                            <div className="relative group">
                                <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-3xl shadow-inner overflow-hidden">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <button className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full text-white shadow-lg border-2 border-indigo-700 hover:bg-blue-400 transition-colors">
                                    <Camera className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-xl font-bold">{formData.name}</h2>
                                <p className="text-blue-100 opacity-90 text-sm">Gerencie suas informações pessoais e segurança</p>
                            </div>
                        </div>
                    </div>

                    {/* Compact Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Main Info Form - Left Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 h-full">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    Informações Pessoais
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-300">Nome Completo</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9"
                                                />
                                                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-300">Cargo</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.role}
                                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9 appearance-none cursor-pointer"
                                                >
                                                    <option value="usuario" className="bg-slate-900 text-white">Usuário de Sistema</option>
                                                    <option value="admin" className="bg-slate-900 text-white">Administrador</option>
                                                    <option value="gerente" className="bg-slate-900 text-white">Gerente</option>
                                                </select>
                                                <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-300">Email</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9"
                                                />
                                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-300">Telefone</label>
                                            <div className="relative">
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    maxLength={15}
                                                    onChange={(e) => {
                                                        let v = e.target.value.replace(/\D/g, '');
                                                        if (v.length > 11) v = v.slice(0, 11);

                                                        if (v.length > 10) {
                                                            v = v.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
                                                        } else if (v.length > 6) {
                                                            v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
                                                        } else if (v.length > 2) {
                                                            v = v.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
                                                        }

                                                        setFormData({ ...formData, phone: v });
                                                    }}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-9"
                                                />
                                                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-300">Bio</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            rows={2}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                            placeholder="Conte um pouco sobre você..."
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Salvar Dados
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Password Reset - Right Column (Replaces Stats) */}
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-5 h-full">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    Segurança
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-300">Senha Atual</label>
                                        <input
                                            type="password"
                                            placeholder="••••••"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-300">Nova Senha</label>
                                        <input
                                            type="password"
                                            placeholder="Nova senha"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-300">Confirmar</label>
                                        <input
                                            type="password"
                                            placeholder="Confirme a senha"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleSave}
                                            className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-all border border-white/10 flex items-center justify-center gap-2 text-sm"
                                        >
                                            Alterar Senha
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
