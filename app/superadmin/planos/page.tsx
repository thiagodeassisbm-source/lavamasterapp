'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import Toast, { ToastType } from '@/lib/presentation/components/Toast'
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog'

interface Plano {
    id: string
    nome: string
    descricao: string
    preco: number
    intervalo: string
    limiteUsuarios: number
    limiteClientes: number
    limiteAgendamentos: number
    duracaoDias: number | null
    ativo: boolean
    destaque: boolean
}

export default function PlanosPage() {
    const router = useRouter()
    const [planos, setPlanos] = useState<Plano[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingPlano, setEditingPlano] = useState<Plano | null>(null)

    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco: '',
        intervalo: 'MENSAL',
        limiteUsuarios: 1,
        limiteClientes: 100,
        limiteAgendamentos: 1000,
        duracaoDias: '',
        ativo: true,
        destaque: false
    })

    // Estados para o Modal de Confirmação Padronizado
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [planoToDelete, setPlanoToDelete] = useState<string | null>(null)

    // Estado para o Toast Padronizado
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
        fetchPlanos()
    }, [])

    const fetchPlanos = async () => {
        try {
            const response = await fetch('/api/superadmin/planos')
            const data = await response.json()
            if (Array.isArray(data)) {
                setPlanos(data)
            }
        } catch (error) {
            console.error('Erro ao buscar planos', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Conversão direta pois o input type="number" já fornece formato padrão
            const precoFormatado = Number(formData.preco)

            const payload = {
                ...formData,
                preco: precoFormatado,
                limiteUsuarios: Number(formData.limiteUsuarios),
                limiteClientes: Number(formData.limiteClientes),
                limiteAgendamentos: Number(formData.limiteAgendamentos),
                duracaoDias: formData.intervalo === 'TESTE' ? Number(formData.duracaoDias) : null
            }

            const url = editingPlano
                ? `/api/superadmin/planos/${editingPlano.id}`
                : '/api/superadmin/planos'

            const method = editingPlano ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (response.ok) {
                showToast('success', editingPlano ? 'Atualizado!' : 'Criado!', editingPlano ? 'O plano foi atualizado com sucesso.' : 'O plano foi criado com sucesso.')

                setShowModal(false)
                fetchPlanos()
                setEditingPlano(null)
                // Reset form
                setFormData({
                    nome: '',
                    descricao: '',
                    preco: '',
                    intervalo: 'MENSAL',
                    limiteUsuarios: 1,
                    limiteClientes: 100,
                    limiteAgendamentos: 1000,
                    duracaoDias: '',
                    ativo: true,
                    destaque: false
                })
            } else {
                throw new Error(data.error || 'Erro ao salvar')
            }
        } catch (error: any) {
            console.error('Erro ao salvar', error)
            showToast('error', 'Ops!', error.message || 'Ocorreu um erro ao salvar o plano.')
        }
    }

    const handleEdit = (plano: Plano) => {
        setEditingPlano(plano)
        setFormData({
            nome: plano.nome,
            descricao: plano.descricao || '',
            preco: String(plano.preco),
            intervalo: plano.intervalo,
            limiteUsuarios: plano.limiteUsuarios,
            limiteClientes: plano.limiteClientes,
            limiteAgendamentos: plano.limiteAgendamentos,
            duracaoDias: plano.duracaoDias ? String(plano.duracaoDias) : '',
            ativo: plano.ativo,
            destaque: plano.destaque
        })
        setShowModal(true)
    }

    const handleDeleteClick = (id: string) => {
        setPlanoToDelete(id)
        setIsConfirmOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!planoToDelete) return

        setIsConfirmOpen(false)
        try {
            const response = await fetch(`/api/superadmin/planos/${planoToDelete}`, { method: 'DELETE' })
            if (response.ok) {
                showToast('success', 'Excluído!', 'O plano foi removido do sistema.')
                fetchPlanos()
            } else {
                throw new Error('Erro ao excluir')
            }
        } catch (error) {
            showToast('error', 'Erro!', 'Não foi possível excluir o plano.')
        } finally {
            setPlanoToDelete(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Toast Padronizado do Sistema */}
            <Toast
                isOpen={toastState.isOpen}
                type={toastState.type}
                title={toastState.title}
                message={toastState.message}
                onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))}
            />

            {/* Modal de Confirmação Padronizado */}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Excluir Plano"
                message="Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir"
                cancelText="Não, Cancelar"
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />

            {/* Menu Lateral */}
            <Sidebar />

            <main className="flex-1 lg:ml-72 p-4 md:p-8 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Planos de Assinatura</h1>
                        <p className="text-slate-400">Defina os planos e limites disponíveis para contratação.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPlano(null)
                            setShowModal(true)
                            setFormData({
                                nome: '',
                                descricao: '',
                                preco: '',
                                intervalo: 'MENSAL',
                                limiteUsuarios: 1,
                                limiteClientes: 100,
                                limiteAgendamentos: 1000,
                                duracaoDias: '',
                                ativo: true,
                                destaque: false
                            })
                        }}
                        className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-medium shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all border border-purple-500/20"
                    >
                        <span>+</span> Criar Novo Plano
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                        <p className="mt-2 text-slate-500">Carregando planos...</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {planos.map(plano => (
                            <div key={plano.id} className={`bg-slate-900 rounded-2xl p-6 border transition-all hover:border-slate-700 relative overflow-hidden group ${plano.destaque ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-slate-800'}`}>
                                {plano.destaque && (
                                    <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl font-bold z-10">Destaque</div>
                                )}

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{plano.nome}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded capitalize border border-slate-700">
                                                {plano.intervalo.toLowerCase()}
                                            </span>
                                            {plano.ativo ? (
                                                <span className="text-xs font-semibold bg-green-900/30 text-green-400 border border-green-500/20 px-2 py-0.5 rounded">Ativo</span>
                                            ) : (
                                                <span className="text-xs font-semibold bg-red-900/30 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">Inativo</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        <span className="text-sm font-normal text-slate-500 align-top mr-0.5">R$</span>
                                        {plano.preco.toFixed(2)}
                                    </div>
                                </div>

                                <p className="text-slate-400 mb-6 text-sm min-h-[40px] leading-relaxed">{plano.descricao}</p>

                                <div className="space-y-3 mb-6 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Usuários
                                        </span>
                                        <span className="font-semibold text-slate-300">{plano.limiteUsuarios}</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Clientes
                                        </span>
                                        <span className="font-semibold text-slate-300">{plano.limiteClientes}</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> Agendamentos
                                        </span>
                                        <span className="font-semibold text-slate-300">{plano.limiteAgendamentos}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                                    <button
                                        onClick={() => handleEdit(plano)}
                                        className="flex-1 py-2.5 text-purple-400 font-medium bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-colors text-sm border border-purple-500/20"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(plano.id)}
                                        className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium border border-transparent hover:border-red-500/20"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}

                        {planos.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                                <p className="text-slate-400 font-medium">Nenhum plano cadastrado.</p>
                                <p className="text-slate-500 text-sm mt-1">Crie o primeiro plano para começar a vender.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL - AGORA EM DARK MODE */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl p-5 w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl animate-slide-up border border-slate-700">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-xl font-bold text-white">{editingPlano ? 'Editar Plano' : 'Novo Plano'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Nome do Plano</label>
                                    <input required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" placeholder="Ex: Mensal Básico" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Preço (R$)</label>
                                    <input required type="number" step="0.01" value={formData.preco} onChange={e => setFormData({ ...formData, preco: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" placeholder="0.00" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                                <input value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" placeholder="Breve descrição do plano..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Ciclo de Cobrança</label>
                                    <select value={formData.intervalo} onChange={e => setFormData({ ...formData, intervalo: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm">
                                        <option value="MENSAL">Mensal</option>
                                        <option value="TRIMESTRAL">Trimestral</option>
                                        <option value="SEMESTRAL">Semestral</option>
                                        <option value="ANUAL">Anual</option>
                                        <option value="TESTE">Teste / Grátis</option>
                                    </select>
                                </div>
                                {formData.intervalo === 'TESTE' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Dias de Teste</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.duracaoDias}
                                            onChange={e => setFormData({ ...formData, duracaoDias: e.target.value })}
                                            className="w-full bg-slate-950 border border-purple-500/50 text-white p-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                            placeholder="Ex: 7"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                <p className="font-semibold text-slate-200 mb-2 text-sm">Limites do Sistema</p>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1 text-center">Usuários</label>
                                        <input type="number" required value={formData.limiteUsuarios} onChange={e => setFormData({ ...formData, limiteUsuarios: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 text-white p-1.5 rounded-lg text-center font-bold focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1 text-center">Clientes</label>
                                        <input type="number" required value={formData.limiteClientes} onChange={e => setFormData({ ...formData, limiteClientes: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 text-white p-1.5 rounded-lg text-center font-bold focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1 text-center">Agend.</label>
                                        <input type="number" required value={formData.limiteAgendamentos} onChange={e => setFormData({ ...formData, limiteAgendamentos: parseInt(e.target.value) })} className="w-full bg-slate-900 border border-slate-700 text-white p-1.5 rounded-lg text-center font-bold focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={formData.ativo} onChange={e => setFormData({ ...formData, ativo: e.target.checked })} className="w-4 h-4 text-purple-600 rounded bg-slate-800 border-slate-600 focus:ring-purple-500" />
                                    <span className="text-sm text-slate-300 group-hover:text-purple-400 transition-colors">Plano Ativo</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={formData.destaque} onChange={e => setFormData({ ...formData, destaque: e.target.checked })} className="w-4 h-4 text-purple-600 rounded bg-slate-800 border-slate-600 focus:ring-purple-500" />
                                    <span className="text-sm text-slate-300 group-hover:text-purple-400 transition-colors">Plano em Destaque</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg font-medium transition-colors text-sm">Cancelar</button>
                                <button type="submit" className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-lg shadow-purple-900/30 transition-colors border border-purple-500/20 text-sm">
                                    {editingPlano ? 'Salvar Alterações' : 'Criar Plano'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
