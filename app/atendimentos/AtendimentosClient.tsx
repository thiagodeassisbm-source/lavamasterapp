'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import {
    Search,
    Car,
    Clock,
    CheckCircle,
    MoreVertical,
    Calendar,
    ArrowRight
} from 'lucide-react';

interface Atendimento {
    id: string;
    clienteNome: string;
    clienteId: string;
    veiculo?: string;
    servicos: any[];
    valorTotal: number;
    status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    dataHora: string;
    formaPagamento: string;
}

interface AtendimentosClientProps {
    initialAtendimentos: Atendimento[];
}

export default function AtendimentosClient({ initialAtendimentos }: AtendimentosClientProps) {
    const router = useRouter();
    const [atendimentos, setAtendimentos] = useState<Atendimento[]>(initialAtendimentos);
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
                data.sort((a: Atendimento, b: Atendimento) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
                setAtendimentos(data);
            }
        } catch (error) {
            console.error('Erro ao buscar atendimentos:', error);
        }
    };

    const finalizarAtendimento = async (id: string) => {
        try {
            const res = await fetch('/api/atendimentos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'concluido' })
            });

            if (res.ok) {
                showToast('Sucesso!', 'Atendimento finalizado com sucesso.', 'success');
                fetchAtendimentos();
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
        <main className="p-4 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Atendimentos</h1>
                    <p className="text-slate-400">Gerencie os serviços em andamento e finalizados</p>
                </div>

                <div className="flex gap-2">
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        {['em_andamento', 'concluido', 'todos'].map(f => (
                            <button
                                key={f}
                                onClick={() => setStatusFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                {f === 'em_andamento' ? 'Em Andamento' : f === 'concluido' ? 'Finalizados' : 'Todos'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por cliente, veículo..."
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAtendimentos.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                        <Car className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold text-white mb-2">Nenhum atendimento encontrado</h3>
                    </div>
                ) : (
                    filteredAtendimentos.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => router.push(`/novo-atendimento?id=${item.id}`)}
                            className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 flex flex-col cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                                    {item.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[10px] font-bold">
                                            {new Date(item.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors uppercase truncate">
                                    {item.clienteNome}
                                </h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Car className="w-4 h-4 text-blue-500/50" />
                                    <span className="truncate">{item.veiculo || 'Sem veículo'}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5 mb-6 flex-1">
                                {item.servicos.map((servico: any, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-black/20 p-2 rounded-lg border border-white/5">
                                        <CheckCircle className="w-3 h-3 text-green-500/50" />
                                        {typeof servico === 'string' ? servico : (servico.nome || 'Serviço')}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Total</p>
                                    <p className="text-lg font-black text-green-400">R$ {item.valorTotal.toFixed(2)}</p>
                                </div>

                                <div className="flex gap-2">
                                    {item.status === 'em_andamento' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); finalizarAtendimento(item.id); }}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            Finalizar <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}
                                    {item.status !== 'cancelado' && item.status !== 'concluido' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); cancelarAtendimento(item.id); }}
                                            className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded-lg transition-colors"
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

            <Toast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
            />
        </main>
    );
}
