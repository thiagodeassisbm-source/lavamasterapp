'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import {
    Search,
    User,
    Car,
    Clock,
    CheckCircle,
    DollarSign,
    MoreVertical,
    Calendar,
    Filter,
    ArrowRight
} from 'lucide-react';

interface Atendimento {
    id: string;
    clienteNome: string;
    clienteId: string;
    veiculo?: string;
    servicos: string[];
    valorTotal: number;
    status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    dataHora: string;
    formaPagamento: string;
}

export default function AtendimentosPage() {
    const router = useRouter();
    const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('em_andamento');

    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    const fetchAtendimentos = async () => {
        try {
            const res = await fetch('/api/atendimentos');
            if (res.ok) {
                const data = await res.json();
                // Ordenar por data (mais recentes primeiro)
                data.sort((a: Atendimento, b: Atendimento) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
                setAtendimentos(data);
            }
        } catch (error) {
            console.error('Erro ao buscar atendimentos:', error);
            showToast('Erro', 'Falha ao carregar lista de atendimentos', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAtendimentos();
    }, []);

    const finalizarAtendimento = async (id: string) => {
        try {
            const res = await fetch('/api/atendimentos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'concluido' })
            });

            if (res.ok) {
                showToast('Sucesso!', 'Atendimento finalizado com sucesso.', 'success');
                fetchAtendimentos(); // Recarrega a lista
            } else {
                throw new Error('Falha ao atualizar');
            }
        } catch (error) {
            showToast('Erro', 'Não foi possível finalizar o atendimento', 'error');
        }
    };

    const cancelarAtendimento = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este atendimento?')) return;

        try {
            const res = await fetch('/api/atendimentos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'cancelado' })
            });

            if (res.ok) {
                showToast('Cancelado', 'Atendimento cancelado.', 'warning');
                fetchAtendimentos();
            }
        } catch (error) {
            showToast('Erro', 'Erro ao cancelar', 'error');
        }
    };

    const filteredAtendimentos = atendimentos.filter(atendimento => {
        const matchesSearch = atendimento.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (atendimento.veiculo && atendimento.veiculo.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'todos' || atendimento.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        const colors = {
            agendado: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            confirmado: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            em_andamento: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            concluido: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            cancelado: 'text-red-400 bg-red-500/10 border-red-500/20',
        };
        return colors[status as keyof typeof colors] || colors.agendado;
    };

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />

            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Atendimentos</h1>
                        <p className="text-slate-400">Gerencie os serviços em andamento e finalizados</p>
                    </div>

                    <div className="flex gap-2">
                        {/* Status Filter Tabs */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button
                                onClick={() => setStatusFilter('em_andamento')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'em_andamento' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Em Andamento
                            </button>
                            <button
                                onClick={() => setStatusFilter('concluido')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'concluido' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Finalizados
                            </button>
                            <button
                                onClick={() => setStatusFilter('todos')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'todos' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Todos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente, veículo..."
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            Carregando atendimentos...
                        </div>
                    ) : filteredAtendimentos.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Car className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Nenhum atendimento encontrado</h3>
                            <p className="text-slate-400">Não há serviços correspondentes ao filtro atual.</p>
                        </div>
                    ) : (
                        filteredAtendimentos.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => router.push(`/novo-atendimento?id=${item.id}`)}
                                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 flex flex-col cursor-pointer"
                            >
                                {/* Status Badge */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-sm shadow-blue-500/10">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold">
                                                {new Date(item.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 shadow-sm shadow-purple-500/10">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold">
                                                {new Date(item.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                        {item.clienteNome}
                                    </h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Car className="w-4 h-4" />
                                        <span>{item.veiculo || 'Veículo não informado'}</span>
                                    </div>
                                </div>

                                {/* Services */}
                                <div className="space-y-2 mb-6 flex-1">
                                    {item.servicos.map((servico: any, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                            <CheckCircle className="w-3 h-3 text-green-500/50" />
                                            {typeof servico === 'string' ? servico : (servico.nome || 'Serviço')}
                                        </div>
                                    ))}
                                </div>

                                {/* Footer & Actions */}
                                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Total</p>
                                        <p className="text-lg font-bold text-green-400">R$ {item.valorTotal.toFixed(2)}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        {item.status === 'em_andamento' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); finalizarAtendimento(item.id); }}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
                                            >
                                                Finalizar
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}
                                        {item.status !== 'cancelado' && item.status !== 'concluido' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); cancelarAtendimento(item.id); }}
                                                className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                title="Cancelar"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <Toast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
