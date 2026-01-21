'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar' // Importando o menu lateral
import { Building, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Empresa {
    id: string
    nome: string
    cnpj: string
    email: string
    ativo: boolean
    bloqueado: boolean
    valorMensal: number
}

export default function SuperAdminDashboard() {
    const router = useRouter()
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('superadmin_token')
        if (!token) {
            router.push('/superadmin')
            return
        }
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('superadmin_token')
            // Busca todas as empresas para calcular os KPIs
            const response = await fetch(`/api/superadmin/empresas?status=all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            const data = await response.json()
            setEmpresas(data.empresas || [])
        } catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    // Cálculos Rápidos
    const totalRevenue = empresas.reduce((acc, e) => acc + e.valorMensal, 0)
    const activeCompanies = empresas.filter(e => e.ativo && !e.bloqueado).length
    const blockedCompanies = empresas.filter(e => e.bloqueado).length

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">

            {/* 1. Menu Lateral */}
            <Sidebar />

            {/* 2. Conteúdo Principal */}
            <main className="flex-1 lg:ml-72 p-4 md:p-8 transition-all">

                {/* Header da Página */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
                        <p className="text-slate-400">Acompanhe o desempenho geral do sistema.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shadow-sm">
                            Hoje: {new Date().toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                    </div>
                ) : (
                    /* Cards de Métricas (Design Dark Moderno) */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

                        {/* Card 1: Total Empresas */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Building className="w-24 h-24 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
                                    <Building size={24} />
                                </div>
                                <p className="text-sm font-medium text-slate-400">Total de Empresas</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{empresas.length}</h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-green-400 font-medium">
                                    <TrendingUp size={14} />
                                    <span>Base total de clientes</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Ativas */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="w-24 h-24 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-4 border border-green-500/20">
                                    <CheckCircle2 size={24} />
                                </div>
                                <p className="text-sm font-medium text-slate-400">Empresas Ativas</p>
                                <h3 className="text-3xl font-bold text-white mt-1">{activeCompanies}</h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                    <span>Operando normalmente</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Receita */}
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-900 p-6 rounded-2xl border border-purple-500/30 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <TrendingUp className="w-24 h-24 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white mb-4 border border-white/10">
                                    <span className="text-lg font-bold">R$</span>
                                </div>
                                <p className="text-sm font-medium text-purple-200">Receita Mensal Recorrente</p>
                                <h3 className="text-3xl font-bold text-white mt-1">
                                    {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </h3>
                                <div className="flex items-center gap-1 mt-2 text-xs text-purple-200/80">
                                    <span>Previsão próx. mês: +5%</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 4: Bloqueadas */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 group hover:border-red-900/50 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 border border-red-500/20">
                                    <AlertCircle size={24} />
                                </div>
                                <span className="text-xs font-bold text-red-400 bg-red-950/30 px-2 py-1 rounded border border-red-900/50">Atenção</span>
                            </div>
                            <p className="text-sm font-medium text-slate-400">Bloqueadas / Inadimplentes</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{blockedCompanies}</h3>
                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                <span>Requer ação imediata</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Placeholder Dark */}
                <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl h-64 flex items-center justify-center">
                    <p className="text-slate-600 font-medium">Gráficos de desempenho (em breve)</p>
                </div>

            </main>
        </div>
    )
}
