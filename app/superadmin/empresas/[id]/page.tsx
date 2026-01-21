'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '../../components/Sidebar'
import Toast, { ToastType } from '@/lib/presentation/components/Toast'
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog'
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    Users,
    ShieldAlert,
    ArrowLeft,
    Save,
    Lock,
    Unlock,
    Info,
    CheckCircle2,
    XCircle,
    Package,
    ArrowUpRight
} from 'lucide-react'

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

interface EmpresaData {
    id: string
    nome: string
    cnpj: string
    email: string
    telefone: string
    endereco: string
    cidade: string
    estado: string
    cep: string
    plano: string
    planoId?: string
    valorMensal: number
    ativo: boolean
    bloqueado: boolean
    motivoBloqueio: string
    proximoVencimento: string
    dataContratacao: string
    dataExpiracao: string
    limiteUsuarios: number
    limiteClientes: number
    limiteAgendamentos: number
    observacoesInternas: string
    senhaAdmin?: string
    _count?: {
        usuarios: number
        clientes: number
        agendamentos: number
    }
    usuarios?: any[]
}

export default function EmpresaDetalhes() {
    const router = useRouter()
    const params = useParams()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<EmpresaData | null>(null)
    const [planos, setPlanos] = useState<Plano[]>([])

    // Toast state
    const [toastState, setToastState] = useState<{
        isOpen: boolean;
        type: ToastType;
        title: string;
        message?: string;
    }>({ isOpen: false, type: 'success', title: '' });

    const showToast = (type: ToastType, title: string, message?: string) => {
        setToastState({ isOpen: true, type, title, message });
    }

    // Modal de Bloqueio state
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
    const [motivoBloqueioInput, setMotivoBloqueioInput] = useState('')

    useEffect(() => {
        if (params.id) {
            Promise.all([fetchEmpresa(), fetchPlanos()])
                .finally(() => setLoading(false))
        }
    }, [params.id])

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

    const fetchEmpresa = async () => {
        try {
            const token = localStorage.getItem('superadmin_token')
            const response = await fetch(`/api/superadmin/empresas/${params.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!response.ok) throw new Error('Falha ao buscar empresa')

            const data = await response.json()

            setFormData({
                id: data.id,
                nome: data.nome || '',
                cnpj: data.cnpj || '',
                email: data.email || '',
                telefone: data.telefone || '',
                endereco: data.endereco || '',
                cidade: data.cidade || '',
                estado: data.estado || '',
                cep: data.cep || '',
                plano: data.plano || '',
                planoId: data.planoId || '',
                valorMensal: Number(data.valorMensal) || 0,
                ativo: data.ativo ?? true,
                bloqueado: data.bloqueado ?? false,
                motivoBloqueio: data.motivoBloqueio || '',
                dataContratacao: data.dataContratacao ? data.dataContratacao.split('T')[0] : new Date().toISOString().split('T')[0],
                dataExpiracao: data.dataExpiracao ? data.dataExpiracao.split('T')[0] : '',
                proximoVencimento: data.proximoVencimento ? data.proximoVencimento.split('T')[0] : '',
                limiteUsuarios: data.limiteUsuarios || 0,
                limiteClientes: data.limiteClientes || 0,
                limiteAgendamentos: data.limiteAgendamentos || 0,
                observacoesInternas: data.observacoesInternas || '',
                _count: data._count,
                usuarios: data.usuarios || []
            })
        } catch (error) {
            console.error('Erro ao buscar empresa:', error)
            showToast('error', 'Erro!', 'Falha ao carregar dados da empresa.')
        }
    }

    const handleChange = (field: keyof EmpresaData, value: any) => {
        if (!formData) return
        setFormData(prev => prev ? ({ ...prev, [field]: value }) : null)
    }

    const calculateExpiration = (startDate: string, days: number | null): string => {
        if (!days) return ''
        const date = new Date(startDate)
        date.setDate(date.getDate() + days)
        return date.toISOString().split('T')[0]
    }

    const handlePlanChange = (planId: string) => {
        if (!formData) return
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

            if (newExpiration) {
                showToast('success', 'Plano de Teste', `O acesso expira em ${newExpiration} (${selectedPlan.duracaoDias} dias).`)
            } else {
                showToast('success', 'Plano Selecionado', `Os limites foram atualizados para o plano ${selectedPlan.nome}.`)
            }
        } else {
            setFormData({ ...formData, planoId: '', plano: '' })
        }
    }

    const handleContratacaoChange = (newDate: string) => {
        if (!formData) return
        const selectedPlan = planos.find(p => p.id === formData.planoId)
        const expiration = calculateExpiration(newDate, selectedPlan?.duracaoDias || null)

        setFormData({
            ...formData,
            dataContratacao: newDate,
            dataExpiracao: expiration
        })
    }

    const handleSave = async () => {
        if (!formData) return
        setSaving(true)

        try {
            const token = localStorage.getItem('superadmin_token')
            const response = await fetch(`/api/superadmin/empresas/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    valorMensal: Number(formData.valorMensal)
                })
            })

            if (response.ok) {
                showToast('success', 'Atualizado!', 'As alterações foram salvas com sucesso.')
                if (formData.senhaAdmin) {
                    setFormData(prev => prev ? ({ ...prev, senhaAdmin: '' }) : null)
                }
                fetchEmpresa()
            } else {
                const data = await response.json()
                throw new Error(data.error || 'Falha ao salvar')
            }
        } catch (error: any) {
            showToast('error', 'Erro!', error.message || 'Erro ao salvar as alterações.')
        } finally {
            setSaving(false)
        }
    }

    const handleBlockAction = async (bloquear: boolean) => {
        try {
            const token = localStorage.getItem('superadmin_token')
            const response = await fetch(`/api/superadmin/empresas/${params.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bloqueado: bloquear,
                    motivoBloqueio: bloquear ? motivoBloqueioInput : null
                })
            })

            if (response.ok) {
                showToast('success', bloquear ? 'Bloqueada!' : 'Desbloqueada!', bloquear ? 'A empresa foi bloqueada.' : 'A empresa foi liberada.')
                setIsBlockModalOpen(false)
                setMotivoBloqueioInput('')
                fetchEmpresa()
            }
        } catch (error) {
            showToast('error', 'Erro!', 'Ocorreu um erro ao processar o bloqueio.')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-medium">Carregando ambiente...</p>
                </div>
            </div>
        )
    }

    if (!formData) return null

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            <Sidebar />

            <Toast
                isOpen={toastState.isOpen}
                type={toastState.type}
                title={toastState.title}
                message={toastState.message}
                onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))}
            />

            <main className="flex-1 lg:ml-72 p-4 md:p-8 transition-all">
                {/* Top Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/superadmin/empresas')}
                            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all group"
                        >
                            <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-white">{formData.nome}</h1>
                                {formData.bloqueado && (
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                                        <ShieldAlert size={12} /> BLOQUEADA
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 flex items-center gap-2">
                                <Building2 size={14} />
                                Gerenciar dados e limites da empresa
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {formData.bloqueado ? (
                            <button
                                onClick={() => handleBlockAction(false)}
                                className="px-5 py-2.5 bg-emerald-600/10 text-emerald-500 border border-emerald-600/20 hover:bg-emerald-600/20 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/10"
                            >
                                <Unlock size={18} />
                                Desbloquear
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsBlockModalOpen(true)}
                                className="px-5 py-2.5 bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-900/10"
                            >
                                <Lock size={18} />
                                Bloquear
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm font-medium">Usuários</span>
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Users size={20} className="text-blue-500" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-3xl font-bold text-white">
                                {formData._count?.usuarios || 0}
                                <span className="text-slate-500 text-lg font-normal"> / {formData.limiteUsuarios}</span>
                            </h3>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(((formData._count?.usuarios || 0) / (formData.limiteUsuarios || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm font-medium">Clientes</span>
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <Users size={20} className="text-emerald-500" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-3xl font-bold text-white">
                                {formData._count?.clientes || 0}
                                <span className="text-slate-500 text-lg font-normal"> / {formData.limiteClientes}</span>
                            </h3>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(((formData._count?.clientes || 0) / (formData.limiteClientes || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-400 text-sm font-medium">Agendamentos</span>
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <Calendar size={20} className="text-purple-500" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-3xl font-bold text-white">
                                {formData._count?.agendamentos || 0}
                            </h3>
                            <p className="text-slate-500 text-sm mt-3 flex items-center gap-1">
                                <Info size={14} /> Total realizados até o momento
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Session: Dados Cadastrais */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                                <Building2 className="text-purple-500" size={22} />
                                <h2 className="text-xl font-bold">Dados Cadastrais</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Razão Social / Nome</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={e => handleChange('nome', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">CNPJ / CPF</label>
                                    <input
                                        type="text"
                                        value={formData.cnpj}
                                        onChange={e => handleChange('cnpj', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">E-mail de Contato</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => handleChange('email', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Telefone / WhatsApp</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.telefone}
                                            onChange={e => handleChange('telefone', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2 pt-4 border-t border-slate-800">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <ShieldAlert size={14} className="text-amber-500" /> Resetar Senha do Administrador
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={formData.senhaAdmin || ''}
                                            onChange={e => handleChange('senhaAdmin', e.target.value)}
                                            className="w-full bg-slate-950 border border-amber-500/20 rounded-xl px-4 py-3 pl-11 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-700"
                                            placeholder="Digite uma nova senha apenas se desejar alterar..."
                                        />
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic">Deixe em branco para manter a senha atual. Caso preencha, a nova senha passará a valer após salvar.</p>
                                </div>
                            </div>
                        </div>

                        {/* Session: Endereço */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                                <MapPin className="text-emerald-500" size={22} />
                                <h2 className="text-xl font-bold">Localização</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Endereço Completo</label>
                                    <input
                                        type="text"
                                        value={formData.endereco}
                                        onChange={e => handleChange('endereco', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="Rua, Número, Bairro"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Cidade</label>
                                        <input
                                            type="text"
                                            value={formData.cidade}
                                            onChange={e => handleChange('cidade', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Estado (UF)</label>
                                        <input
                                            type="text"
                                            value={formData.estado}
                                            onChange={e => handleChange('estado', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">CEP</label>
                                        <input
                                            type="text"
                                            value={formData.cep}
                                            onChange={e => handleChange('cep', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Session: Plano & Contrato */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                                <Package className="text-indigo-500" size={22} />
                                <h2 className="text-xl font-bold">Assinatura & Plano</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Plano do Sistema</label>
                                        <div className="relative">
                                            <select
                                                value={formData.planoId || ''}
                                                onChange={e => handlePlanChange(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Selecione um plano...</option>
                                                {planos.map(plano => (
                                                    <option key={plano.id} value={plano.id}>
                                                        {plano.nome}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ArrowUpRight size={18} className="text-slate-500" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">Valor Mensal Personalizado</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.valorMensal}
                                                onChange={e => handleChange('valorMensal', e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Calendar size={14} /> Data da Contratação
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.dataContratacao}
                                            onChange={e => handleContratacaoChange(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <CreditCard size={14} /> Próximo Vencimento
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.proximoVencimento}
                                            onChange={e => handleChange('proximoVencimento', e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        />
                                    </div>
                                    {formData.dataExpiracao && (
                                        <div className="pt-2">
                                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                                <p className="text-[10px] font-bold text-purple-400 uppercase">Expiração Estimada</p>
                                                <p className="text-sm font-bold text-white">{new Date(formData.dataExpiracao).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Session: Limites Customizados */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                                <ShieldAlert className="text-amber-500" size={22} />
                                <h2 className="text-xl font-bold">Controle de Limites</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/30 text-center group hover:border-purple-500/30 transition-all">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-4">Limite de Usuários</p>
                                    <input
                                        type="number"
                                        value={formData.limiteUsuarios}
                                        onChange={e => handleChange('limiteUsuarios', parseInt(e.target.value) || 0)}
                                        className="text-4xl font-black bg-transparent border-none text-white w-full text-center focus:ring-0 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-600 mt-2">Clique para editar</p>
                                </div>
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/30 text-center group hover:border-emerald-500/30 transition-all">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-4">Limite de Clientes</p>
                                    <input
                                        type="number"
                                        value={formData.limiteClientes}
                                        onChange={e => handleChange('limiteClientes', parseInt(e.target.value) || 0)}
                                        className="text-4xl font-black bg-transparent border-none text-white w-full text-center focus:ring-0 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-600 mt-2">Clique para editar</p>
                                </div>
                                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/30 text-center group hover:border-blue-500/30 transition-all">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-4">Limite Agend./mês</p>
                                    <input
                                        type="number"
                                        value={formData.limiteAgendamentos}
                                        onChange={e => handleChange('limiteAgendamentos', parseInt(e.target.value) || 0)}
                                        className="text-4xl font-black bg-transparent border-none text-white w-full text-center focus:ring-0 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-600 mt-2">Clique para editar</p>
                                </div>
                            </div>
                        </div>

                        {/* Session: Observações */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <Info className="text-slate-500" size={20} />
                                <h2 className="text-lg font-bold">Anotações Administrativas</h2>
                            </div>
                            <textarea
                                value={formData.observacoesInternas}
                                onChange={e => handleChange('observacoesInternas', e.target.value)}
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-slate-300 focus:ring-2 focus:ring-slate-700 outline-none transition-all italic text-sm"
                                placeholder="Anotações internas sobre negociações, problemas ou histórico desta empresa..."
                            />
                        </div>
                    </div>

                    {/* Right Column - Status & Users */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Status Card */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl sticky top-24">
                            <h2 className="text-lg font-bold mb-6 border-b border-slate-800 pb-3">Status da Conta</h2>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="text-sm font-medium text-slate-400">Situação Atual</span>
                                    {formData.ativo ? (
                                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
                                            <CheckCircle2 size={14} /> ATIVA
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                                            <XCircle size={14} /> INATIVA
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between px-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-200">Acesso ao Sistema</span>
                                        <span className="text-[10px] text-slate-500">Alternar entre Ativo/Inativo</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.ativo}
                                            onChange={(e) => handleChange('ativo', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 after:border-slate-800 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 after:bg-slate-300"></div>
                                    </label>
                                </div>

                                {formData.bloqueado && (
                                    <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2 text-red-500">
                                            <ShieldAlert size={16} />
                                            <p className="text-xs font-black uppercase tracking-widest">Acesso Suspenso</p>
                                        </div>
                                        {formData.motivoBloqueio && (
                                            <p className="text-xs text-slate-400 italic font-medium leading-relaxed">
                                                "{formData.motivoBloqueio}"
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Usuários Card */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
                                <h2 className="text-lg font-bold">Gestores ({formData.usuarios?.length || 0})</h2>
                                <Users size={18} className="text-slate-500" />
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {formData.usuarios?.map((usuario: any) => (
                                    <div key={usuario.id} className="p-4 bg-slate-950 border border-slate-800/50 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{usuario.nome}</p>
                                            <p className="text-[10px] text-slate-500 truncate mb-1">{usuario.email}</p>
                                            <span className="px-1.5 py-0.5 bg-slate-900 text-[8px] font-black text-slate-400 rounded uppercase tracking-tighter">
                                                {usuario.role}
                                            </span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${usuario.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                    </div>
                                ))}

                                {(!formData.usuarios || formData.usuarios.length === 0) && (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-slate-600 italic">Nenhum gestor cadastrado.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de Bloqueio Padronizado (Custom implementation to match design) */}
            {isBlockModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
                    <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-500/20 animate-slide-up">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Lock size={32} className="text-red-500" />
                        </div>

                        <h3 className="text-2xl font-black text-center text-white mb-3 tracking-tight">Suspender Empresa</h3>
                        <p className="text-sm text-slate-400 text-center mb-8 px-4 font-medium leading-relaxed">
                            Ao bloquear, <span className="text-red-400">todos os acessos</span> dos usuários desta empresa serão interrompidos imediatamente.
                        </p>

                        <div className="mb-8">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Motivo do Bloqueio</label>
                            <textarea
                                value={motivoBloqueioInput}
                                onChange={(e) => setMotivoBloqueioInput(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder-slate-700 text-sm"
                                placeholder="Descreva brevemente o motivo para controle interno..."
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsBlockModalOpen(false)}
                                className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-bold transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleBlockAction(true)}
                                disabled={!motivoBloqueioInput.trim()}
                                className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-900/40 transition-all text-sm disabled:opacity-50"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
