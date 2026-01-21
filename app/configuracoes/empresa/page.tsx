'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileMenu from '@/lib/presentation/components/MobileMenu'
import toast from 'react-hot-toast'

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
    logo: string | null
    plano: string
    ativo: boolean
}

export default function ConfiguracoesEmpresa() {
    const router = useRouter()
    const [empresa, setEmpresa] = useState<EmpresaData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    useEffect(() => {
        fetchEmpresa()
    }, [])

    const fetchEmpresa = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            console.log('Token:', token ? 'Existe' : 'Não existe')

            const response = await fetch('/api/empresa', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            console.log('Response status:', response.status)

            if (response.ok) {
                const data = await response.json()
                console.log('Empresa carregada:', data)
                setEmpresa(data)
            } else {
                const error = await response.json()
                console.error('Erro da API:', error)
                toast.error(error.error || 'Erro ao carregar dados da empresa')
            }
        } catch (error) {
            console.error('Erro ao buscar empresa:', error)
            toast.error('Erro ao carregar dados da empresa')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!empresa) return

        setSaving(true)

        try {
            const token = localStorage.getItem('auth_token')
            const response = await fetch('/api/empresa', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(empresa)
            })

            if (response.ok) {
                setShowSuccessModal(true)
            } else {
                toast.error('Erro ao salvar dados da empresa')
            }
        } catch (error) {
            toast.error('Erro ao salvar dados da empresa')
        } finally {
            setSaving(false)
        }
    }

    const formatCPFCNPJ = (value: string) => {
        const numbers = value.replace(/\D/g, '')

        // CPF: 000.000.000-00 (11 dígitos)
        if (numbers.length <= 11) {
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1-$2')
                .slice(0, 14)
        }

        // CNPJ: 00.000.000/0000-00 (14 dígitos)
        return numbers
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18)
    }

    const formatCEP = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)
    }

    const formatTelefone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d)/, '($1) $2-$3')
        }
        return numbers.replace(/(\d{2})(\d{5})(\d)/, '($1) $2-$3').slice(0, 15)
    }

    const buscarCEP = async (cep: string) => {
        const cepLimpo = cep.replace(/\D/g, '')

        if (cepLimpo.length === 8 && empresa) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
                const data = await response.json()

                if (!data.erro) {
                    setEmpresa({
                        ...empresa,
                        cep: formatCEP(cep),
                        endereco: data.logradouro || '',
                        cidade: data.localidade || '',
                        estado: data.uf || ''
                    })
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen">
                <MobileMenu />
                <main className="flex-1 lg:ml-72 bg-slate-950 flex items-center justify-center">
                    <div className="text-white">Carregando...</div>
                </main>
            </div>
        )
    }

    if (!empresa) {
        return (
            <div className="flex min-h-screen">
                <MobileMenu />
                <main className="flex-1 lg:ml-72 bg-slate-950 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-white text-xl mb-4">Empresa não encontrada</div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen">
            <MobileMenu />
            <main className="flex-1 lg:ml-72 bg-slate-950">
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-white">Dados da Empresa</h1>
                        <p className="text-slate-400 mt-1">Gerencie as informações da sua empresa</p>
                    </div>



                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informações do Plano */}
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Plano Atual</h2>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${empresa.plano === 'basico' ? 'bg-blue-500/20 text-blue-400' :
                                    empresa.plano === 'premium' ? 'bg-purple-500/20 text-purple-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                    {empresa.plano.charAt(0).toUpperCase() + empresa.plano.slice(1)}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400">
                                Para alterar seu plano ou solicitar mais recursos, entre em contato com o suporte.
                            </p>
                        </div>

                        {/* Dados Básicos */}
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Dados Básicos</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Nome da Empresa *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={empresa.nome}
                                        onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nome da sua empresa"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        CPF/CNPJ *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={empresa.cnpj}
                                        onChange={(e) => setEmpresa({ ...empresa, cnpj: formatCPFCNPJ(e.target.value) })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={empresa.email}
                                        onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="contato@empresa.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        value={empresa.telefone || ''}
                                        onChange={(e) => setEmpresa({ ...empresa, telefone: formatTelefone(e.target.value) })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Endereço</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CEP - PRIMEIRO CAMPO */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        CEP
                                    </label>
                                    <input
                                        type="text"
                                        value={empresa.cep || ''}
                                        onChange={(e) => {
                                            const cepFormatado = formatCEP(e.target.value)
                                            setEmpresa({ ...empresa, cep: cepFormatado })
                                        }}
                                        onBlur={(e) => buscarCEP(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                buscarCEP(e.currentTarget.value)
                                            }
                                        }}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="00000-000"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Endereço Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={empresa.endereco || ''}
                                        onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Rua, número, complemento"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Cidade
                                    </label>
                                    <input
                                        type="text"
                                        value={empresa.cidade || ''}
                                        onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Nome da cidade"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">
                                        Estado
                                    </label>
                                    <select
                                        value={empresa.estado || ''}
                                        onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="AC">Acre</option>
                                        <option value="AL">Alagoas</option>
                                        <option value="AP">Amapá</option>
                                        <option value="AM">Amazonas</option>
                                        <option value="BA">Bahia</option>
                                        <option value="CE">Ceará</option>
                                        <option value="DF">Distrito Federal</option>
                                        <option value="ES">Espírito Santo</option>
                                        <option value="GO">Goiás</option>
                                        <option value="MA">Maranhão</option>
                                        <option value="MT">Mato Grosso</option>
                                        <option value="MS">Mato Grosso do Sul</option>
                                        <option value="MG">Minas Gerais</option>
                                        <option value="PA">Pará</option>
                                        <option value="PB">Paraíba</option>
                                        <option value="PR">Paraná</option>
                                        <option value="PE">Pernambuco</option>
                                        <option value="PI">Piauí</option>
                                        <option value="RJ">Rio de Janeiro</option>
                                        <option value="RN">Rio Grande do Norte</option>
                                        <option value="RS">Rio Grande do Sul</option>
                                        <option value="RO">Rondônia</option>
                                        <option value="RR">Roraima</option>
                                        <option value="SC">Santa Catarina</option>
                                        <option value="SP">São Paulo</option>
                                        <option value="SE">Sergipe</option>
                                        <option value="TO">Tocantins</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-2 border border-white/10 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* Modal de Sucesso */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        {/* Ícone de Sucesso */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        {/* Título */}
                        <h2 className="text-2xl font-bold text-white text-center mb-3">
                            Salvo com Sucesso!
                        </h2>

                        {/* Mensagem */}
                        <p className="text-slate-400 text-center mb-8">
                            Os dados da empresa foram atualizados com sucesso no sistema.
                        </p>

                        {/* Botão OK */}
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
