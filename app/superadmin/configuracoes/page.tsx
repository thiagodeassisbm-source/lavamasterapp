'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import Toast, { ToastType } from '@/lib/presentation/components/Toast'
import { User, Mail, Lock, ShieldCheck, Save, Loader2 } from 'lucide-react'

export default function PerfilPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
    })

    const [toastState, setToastState] = useState<{
        isOpen: boolean;
        type: ToastType;
        title: string;
        message?: string;
    }>({ isOpen: false, type: 'success', title: '' });

    const showToast = (type: ToastType, title: string, message?: string) => {
        setToastState({ isOpen: true, type, title, message });
    };

    useEffect(() => {
        const token = localStorage.getItem('superadmin_token')
        if (!token) {
            router.push('/superadmin')
            return
        }
        fetchPerfil()
    }, [])

    const fetchPerfil = async () => {
        try {
            const token = localStorage.getItem('superadmin_token')
            const response = await fetch('/api/superadmin/perfil', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
                const data = await response.json()
                setFormData(prev => ({
                    ...prev,
                    nome: data.nome,
                    email: data.email
                }))
            }
        } catch (error) {
            console.error('Erro ao buscar perfil', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.novaSenha && formData.novaSenha !== formData.confirmarSenha) {
            showToast('error', 'Erro!', 'As senhas não coincidem.')
            return
        }

        setSaving(true)
        try {
            const token = localStorage.getItem('superadmin_token')
            const response = await fetch('/api/superadmin/perfil', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nome: formData.nome,
                    email: formData.email,
                    senhaAtual: formData.senhaAtual,
                    novaSenha: formData.novaSenha
                })
            })

            const data = await response.json()

            if (response.ok) {
                showToast('success', 'Sucesso!', 'Perfil atualizado com sucesso.')
                setFormData(prev => ({
                    ...prev,
                    senhaAtual: '',
                    novaSenha: '',
                    confirmarSenha: ''
                }))
                // Atualizar dados no localStorage
                const user = JSON.parse(localStorage.getItem('superadmin_user') || '{}')
                localStorage.setItem('superadmin_user', JSON.stringify({
                    ...user,
                    nome: data.nome,
                    email: data.email
                }))
            } else {
                showToast('error', 'Erro!', data.error || 'Erro ao atualizar perfil.')
            }
        } catch (error) {
            showToast('error', 'Erro!', 'Ocorreu um erro ao processar sua solicitação.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            <Toast
                isOpen={toastState.isOpen}
                type={toastState.type}
                title={toastState.title}
                message={toastState.message}
                onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))}
            />

            <Sidebar />

            <main className="flex-1 lg:ml-72 p-4 md:p-8 transition-all">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-purple-500" />
                        Configurações de Perfil
                    </h1>
                    <p className="text-slate-400">Gerencie suas credenciais de acesso ao painel Master Control.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                ) : (
                    <div className="max-w-4xl">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Card: Dados Básicos */}
                            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <User size={20} className="text-slate-400" />
                                    Dados Admin
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Nome Completo</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="text"
                                                value={formData.nome}
                                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all pl-10"
                                                placeholder="Nome do administrador"
                                            />
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">E-mail Master</label>
                                        <div className="relative">
                                            <input
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all pl-10"
                                                placeholder="email@master.com"
                                            />
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card: Segurança / Senha */}
                            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Lock size={20} className="text-slate-400" />
                                    Segurança e Senha
                                </h2>

                                <p className="text-sm text-slate-500 mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    Dica: Deixe os campos de senha em branco se não desejar alterá-la. Caso queira mudar, a senha atual é obrigatória.
                                </p>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">Senha Atual</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                value={formData.senhaAtual}
                                                onChange={e => setFormData({ ...formData, senhaAtual: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all pl-10"
                                                placeholder="••••••••"
                                            />
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Nova Senha</label>
                                            <input
                                                type="password"
                                                value={formData.novaSenha}
                                                onChange={e => setFormData({ ...formData, novaSenha: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">Confirmar Nova Senha</label>
                                            <input
                                                type="password"
                                                value={formData.confirmarSenha}
                                                onChange={e => setFormData({ ...formData, confirmarSenha: e.target.value })}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                                placeholder="Repita a nova senha"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-purple-900/30 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    )
}
