'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Search, Filter, X, Save, Tag, CreditCard } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function FinanceiroPage() {
    // --- States ---
    const [receitas, setReceitas] = useState<any[]>([]);
    const [despesas, setDespesas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    // New Expense Form State
    const [novaDespesa, setNovaDespesa] = useState({
        descricao: '',
        valor: '',
        categoria: 'Outros',
        data: new Date().toISOString().split('T')[0],
        formaPagamento: 'pix'
    });

    const categorias = [
        'Aluguel',
        'Fornecedores',
        'Funcionários',
        'Energia/Água/Internet',
        'Manutenção',
        'Marketing',
        'Impostos',
        'Outros'
    ];

    const formasPagamento = [
        { id: 'pix', label: 'PIX' },
        { id: 'cartao_credito', label: 'Cartão de Crédito' },
        { id: 'cartao_debito', label: 'Cartão de Débito' },
        { id: 'dinheiro', label: 'Dinheiro' },
        { id: 'boleto', label: 'Boleto' }
    ];

    // --- Fetch Data ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resAtendimentos, resDespesas] = await Promise.all([
                fetch('/api/atendimentos'),
                fetch('/api/despesas')
            ]);

            if (resAtendimentos.ok) {
                const data = await resAtendimentos.json();
                const completedServices = data
                    .filter((a: any) => a.status === 'concluido')
                    .map((a: any) => ({
                        id: a.id,
                        descricao: `Serviço - ${a.clienteNome}`,
                        cliente: a.clienteNome,
                        valor: a.valorTotal,
                        data: a.dataHora.split('T')[0],
                        tipo: 'receita'
                    }));
                setReceitas(completedServices);
            }

            if (resDespesas.ok) {
                const dataDespesas = await resDespesas.json();
                setDespesas(dataDespesas.map((d: any) => ({
                    ...d,
                    tipo: 'despesa'
                })));
            }

        } catch (error) {
            console.error('Erro ao buscar financeiro:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Actions ---
    const handleSaveDespesa = async () => {
        if (!novaDespesa.descricao || !novaDespesa.valor) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            const res = await fetch('/api/despesas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao: novaDespesa.descricao,
                    valor: parseFloat(novaDespesa.valor.replace(',', '.')),
                    categoria: novaDespesa.categoria,
                    data: novaDespesa.data,
                    formaPagamento: novaDespesa.formaPagamento
                })
            });

            if (res.ok) {
                toast.success('Despesa salva com sucesso!');
                setIsModalOpen(false);
                setNovaDespesa({
                    descricao: '',
                    valor: '',
                    categoria: 'Outros',
                    data: new Date().toISOString().split('T')[0],
                    formaPagamento: 'pix'
                });
                fetchData(); // Refresh list
            } else {
                throw new Error('Falha ao salvar');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar despesa');
        }
    };

    // --- Filter Logic ---
    const filterData = (items: any[]) => {
        return items.filter(item => {
            const itemDate = new Date(item.data);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && itemDate < start) return false;
            if (end) {
                const endOfDay = new Date(end);
                endOfDay.setHours(23, 59, 59, 999);
                if (itemDate > endOfDay) return false;
            }

            if (clientSearch) {
                const searchLower = clientSearch.toLowerCase();
                const text = (item.descricao || '').toLowerCase() + (item.cliente || '').toLowerCase();
                if (!text.includes(searchLower)) return false;
            }

            return true;
        });
    };

    const filteredReceitas = filterData(receitas);
    const filteredDespesas = filterData(despesas);

    // --- Totals ---
    const totalReceitas = filteredReceitas.reduce((acc, r) => acc + (r.valor || 0), 0);
    const totalDespesas = filteredDespesas.reduce((acc, d) => acc + (d.valor || 0), 0);
    const saldo = totalReceitas - totalDespesas;

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setClientSearch('');
    };

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />
            <Toaster position="top-right" />

            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Financeiro</h1>
                        <p className="text-slate-400">Controle de receitas e despesas</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Despesa
                    </button>
                </div>

                {/* Filters Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-sm text-slate-400 mb-1 block">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    placeholder="Cliente, descrição..."
                                    className="w-full pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="text-sm text-slate-400 mb-1 block">Data Inicial</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                            />
                        </div>

                        <div className="w-full sm:w-auto">
                            <label className="text-sm text-slate-400 mb-1 block">Data Final</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                            />
                        </div>

                        {(startDate || endDate || clientSearch) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/5 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Limpar
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-effect rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="w-24 h-24 transform rotate-12" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Receitas Filtradas</p>
                                <p className="text-2xl font-bold text-green-400">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingDown className="w-24 h-24 transform rotate-12" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <TrendingDown className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Despesas Filtradas</p>
                                <p className="text-2xl font-bold text-red-400">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign className="w-24 h-24 transform rotate-12" />
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Saldo no Período</p>
                                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    {saldo < 0 && ' (Neg)'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Receitas List */}
                    <div className="flex flex-col h-full">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Receitas
                        </h2>
                        <div className="flex-1 space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="text-center py-10 text-slate-500">Carregando...</div>
                            ) : filteredReceitas.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 border border-dashed border-white/10 rounded-xl">
                                    Nenhuma receita encontrada
                                </div>
                            ) : (
                                filteredReceitas.map(receita => (
                                    <div key={receita.id} className="glass-effect rounded-xl p-4 hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-white">{receita.descricao}</p>
                                                <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(receita.data).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <p className="text-lg font-bold text-green-400">
                                                +R$ {receita.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Despesas List */}
                    <div className="flex flex-col h-full">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                            Despesas
                        </h2>
                        <div className="flex-1 space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="text-center py-10 text-slate-500">Carregando...</div>
                            ) : filteredDespesas.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 border border-dashed border-white/10 rounded-xl">
                                    Nenhuma despesa encontrada
                                </div>
                            ) : (
                                filteredDespesas.map(despesa => (
                                    <div key={despesa.id} className="glass-effect rounded-xl p-4 hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-white">{despesa.descricao}</p>
                                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                                                        {despesa.categoria}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(despesa.data).toLocaleDateString('pt-BR')}
                                                    <span className="mx-1">•</span>
                                                    <span className="capitalize">{despesa.formaPagamento.replace('_', ' ')}</span>
                                                </p>
                                            </div>
                                            <p className="text-lg font-bold text-red-400">
                                                -R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Nova Despesa */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-slide-up">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-red-500" />
                            Nova Despesa
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={novaDespesa.descricao}
                                    onChange={(e) => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })}
                                    placeholder="Ex: Aluguel do mês"
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={novaDespesa.valor}
                                        onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: e.target.value })}
                                        placeholder="0,00"
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Data</label>
                                    <input
                                        type="date"
                                        value={novaDespesa.data}
                                        onChange={(e) => setNovaDespesa({ ...novaDespesa, data: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Categoria</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select
                                        value={novaDespesa.categoria}
                                        onChange={(e) => setNovaDespesa({ ...novaDespesa, categoria: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                                    >
                                        {categorias.map(cat => (
                                            <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Forma de Pagamento</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <select
                                        value={novaDespesa.formaPagamento}
                                        onChange={(e) => setNovaDespesa({ ...novaDespesa, formaPagamento: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                                    >
                                        {formasPagamento.map(fp => (
                                            <option key={fp.id} value={fp.id} className="bg-slate-900">{fp.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveDespesa}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4 flex justify-center items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Salvar Despesa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
