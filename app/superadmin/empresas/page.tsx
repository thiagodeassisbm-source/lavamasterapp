'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar' // Importando o menu lateral
import { Search, Filter, Plus, Building, Users, Calendar, TrendingUp, AlertCircle, CheckCircle2, XCircle, Save, X, Mail, Phone, CreditCard, ShieldAlert, Package, ArrowUpRight } from 'lucide-react'
import Toast, { ToastType } from '@/lib/presentation/components/Toast'

interface Empresa {
    id: string
    nome: string
    cnpj: string
    email: string
    plano: string
    ativo: boolean
    bloqueado: boolean
    valorMensal: number
    dataContratacao: string
    dataExpiracao: string | null
    proximoVencimento: string | null
    _count: {
        usuarios: number
        clientes: number
        agendamentos: number
    }
}

interface Plano {
    id: string
    nome: string
    preco: number
    intervalo: string
    duracaoDias: number | null
    limiteUsuarios: number
    limiteClientes: number
    limiteAgendamentos: number
}

export default function EmpresasPage() {
    const router = useRouter()
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [planos, setPlanos] = useState<Plano[]>([])

    const [toastState, setToastState] = useState<{
        isOpen: boolean;
        type: ToastType;
        title: string;
        message?: string;
    }>({ isOpen: false, type: 'success', title: '' });

    const showToast = (type: ToastType, title: string, message?: string) => {
        setToastState({ isOpen: true, type, title, message });
    }

    const [formData, setFormData] = useState({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        senha: '',
        planoId: '',
        plano: 'basico',
        valorMensal: 0,
        dataContratacao: new Date().toISOString().split('T')[0],
        dataExpiracao: '',
        proximoVencimento: '',
        limiteUsuarios: 5,
        limiteClientes: 100,
        limiteAgendamentos: 1000,
        observacoesInternas: ''
    })

    useEffect(() => {
        const token = localStorage.getItem('superadmin_token')
        if (!token) {
            router.push('/superadmin')
            return
        }
        fetchEmpresas()
        fetchPlanos()
    }, [statusFilter])

    const fetchEmpresas = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('superadmin_token')
            const params = new URLSearchParams()
            if (search) params.append('search', search)
            if (statusFilter !== 'all') params.append('status', statusFilter)

            const response = await fetch(`/api/superadmin/empresas?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setEmpresas(data.empresas || [])
        } catch (error) {
            console.error('Erro ao buscar empresas:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPlanos = async () => {
        try {
            const response = await fetch('/api/superadmin/planos')
            if (response.ok) {
                const data = await response.json()
                setPlanos(data)
            }
        } catch (error) {
            console.error('Erro ao buscar planos:', error)
        }
    }

    const calculateExpiration = (startDate: string, days: number | null): string => {
        if (!days) return ''
        const date = new Date(startDate)
        date.setDate(date.getDate() + days)
        return date.toISOString().split('T')[0]
    }

    const handlePlanChange = (planId: string) => {
        const selectedPlan = planos.find(p => p.id === planId)
        if (selectedPlan) {
            const newExpiration = calculateExpiration(formData.dataContratacao, selectedPlan.duracaoDias)
            setFormData({
                ...formData,
                planoId: selectedPlan.id,
                plano: selectedPlan.nome,
                valorMensal: selectedPlan.preco,
                limiteUsuarios: selectedPlan.limiteUsuarios,
                limiteClientes: selectedPlan.limiteClientes,
                limiteAgendamentos: selectedPlan.limiteAgendamentos,
                dataExpiracao: newExpiration
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const token = localStorage.getItem('superadmin_token')
            const response = await fetch('/api/superadmin/empresas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                showToast('success', 'Sucesso!', 'Nova empresa cadastrada com sucesso.')
                setShowModal(false)
                fetchEmpresas()
                setFormData({
                    nome: '',
                    cnpj: '',
                    email: '',
                    telefone: '',
                    senha: '',
                    planoId: '',
                    plano: 'basico',
                    valorMensal: 0,
                    dataContratacao: new Date().toISOString().split('T')[0],
                    dataExpiracao: '',
                    proximoVencimento: '',
                    limiteUsuarios: 5,
                    limiteClientes: 100,
                    limiteAgendamentos: 1000,
                    observacoesInternas: ''
                })
            } else {
                const data = await response.json()
                showToast('error', 'Erro!', data.error || 'Erro ao cadastrar empresa.')
            }
        } catch (error) {
            showToast('error', 'Erro!', 'Falha ao conectar com o servidor.')
        } finally {
            setSaving(false)
        }
    }

    const getStatusBadge = (empresa: Empresa) => {
        if (empresa.bloqueado) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-red-400/10 text-red-400 border border-red-400/20">
                    <XCircle size={12} /> Bloqueado
                </span>
            )
        }
        if (!empresa.ativo) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-700 text-slate-400 border border-slate-600">
                    <XCircle size={12} /> Inativo
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-green-400/10 text-green-400 border border-green-400/20">
                <CheckCircle2 size={12} /> Ativo
            </span>
        )
    }

    const getPlanoBadge = (plano: string) => {
        const colors: any = {
            basico: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
            premium: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
            enterprise: 'bg-amber-400/10 text-amber-400 border-amber-400/20'
        }
        const colorClass = colors[plano?.toLowerCase()] || 'bg-slate-700 text-slate-300 border-slate-600'

        return (
            <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${colorClass}`}>
                {plano ? plano.charAt(0).toUpperCase() + plano.slice(1) : 'Padrão'}
            </span>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">

            {/* Menu Lateral */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <main className="flex-1 lg:ml-72 p-4 md:p-8 transition-all">

                {/* Header da Página */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gerenciar Empresas</h1>
                        <p className="text-slate-400">Visualize e gerencie todas as contas empresariais cadastradas.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20"
                    >
                        <Plus size={20} />
                        Nova Empresa
                    </button>
                </div>

                {/* Filtros e Busca */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar empresa por nome, CNPJ ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchEmpresas()}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-medium focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer hover:border-slate-700"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="ativo">Apenas Ativos</option>
                                <option value="bloqueado">Bloqueados</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Tabela de Empresas Dark */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Plano</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuários</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 animate-pulse">
                                            Carregando dados...
                                        </td>
                                    </tr>
                                ) : empresas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <Building className="w-12 h-12 mb-3 opacity-20" />
                                                <p className="font-medium">Nenhuma empresa encontrada</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    empresas.map((empresa) => (
                                        <tr key={empresa.id} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs uppercase border border-slate-700">
                                                        {empresa.nome.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{empresa.nome}</div>
                                                        <div className="text-xs text-slate-500">{empresa.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getPlanoBadge(empresa.plano)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(empresa)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1.5 text-sm text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                                    <Users size={14} className="text-slate-500" />
                                                    {empresa._count.usuarios}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-slate-300">
                                                R$ {empresa.valorMensal.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => router.push(`/superadmin/empresas/${empresa.id}`)}
                                                    className="text-purple-400 hover:text-purple-300 font-medium text-sm px-3 py-1.5 hover:bg-purple-500/10 rounded-lg transition-colors"
                                                >
                                                    Gerenciar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Modal de Cadastro */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center">
                                        <Building className="text-purple-500" size={20} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Novo Cadastro de Empresa</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                {/* Dados Básicos */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        <Building size={14} /> Dados Cadastrais
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Razão Social / Nome</label>
                                            <input required type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="Nome da empresa" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">CNPJ / CPF</label>
                                            <input required type="text" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="00.000.000/0000-00" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Email Administrativo</label>
                                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="admin@empresa.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Telefone / WhatsApp</label>
                                            <input type="text" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="(00) 00000-0000" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                                <ShieldAlert size={14} className="text-amber-500" /> Senha de Acesso Admin
                                            </label>
                                            <input required type="password" value={formData.senha} onChange={e => setFormData({ ...formData, senha: e.target.value })} className="w-full bg-slate-950 border border-amber-500/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" placeholder="••••••••" />
                                            <p className="text-[10px] text-slate-500">Esta senha será usada pelo cliente para o primeiro acesso.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Plano e Contrato */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                        <Package size={14} /> Plano & Assinatura
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Plano</label>
                                            <select
                                                required
                                                value={formData.planoId}
                                                onChange={e => handlePlanChange(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="">Selecione um plano...</option>
                                                {planos.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Data de Contratação</label>
                                            <input
                                                required
                                                type="date"
                                                value={formData.dataContratacao}
                                                onChange={e => {
                                                    const newDate = e.target.value
                                                    const selectedPlan = planos.find(p => p.id === formData.planoId)
                                                    setFormData({
                                                        ...formData,
                                                        dataContratacao: newDate,
                                                        dataExpiracao: calculateExpiration(newDate, selectedPlan?.duracaoDias || null)
                                                    })
                                                }}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                            />
                                        </div>
                                        {formData.dataExpiracao && (
                                            <div className="md:col-span-2 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="text-purple-500" size={20} />
                                                    <div>
                                                        <p className="text-xs text-purple-400 font-bold uppercase">Expiração Automática</p>
                                                        <p className="text-sm text-white font-medium">O período de teste termina em {new Date(formData.dataExpiracao).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-800 flex gap-4 sticky bottom-0 bg-slate-900 z-10">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : <Save size={18} />}
                                        Finalizar Cadastro
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <Toast
                    isOpen={toastState.isOpen}
                    type={toastState.type}
                    title={toastState.title}
                    message={toastState.message}
                    onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))}
                />
            </main>
        </div>
    )
}
