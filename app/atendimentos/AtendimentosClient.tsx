'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import UserProfile from '@/lib/presentation/components/UserProfile';
import {
    Search,
    Car,
    Clock,
    CheckCircle,
    MoreVertical,
    Calendar,
    ArrowRight,
    Filter,
    X,
    Trash2
} from 'lucide-react';

interface Atendimento {
    id: string;
    clienteNome: string;
    clienteId: string;
    veiculo: string;
    servicos: string[];
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
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [atendimentoToDelete, setAtendimentoToDelete] = useState<string | null>(null);

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    const fetchAtendimentos = async () => {
        try {
            const res = await fetch('/api/atendimentos');
            if (res.ok) {
                const data = await res.json();
                setAtendimentos(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/atendimentos?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                showToast('Sucesso!', 'Status atualizado.', 'success');
                fetchAtendimentos();
            }
        } catch (error) {
            showToast('Erro', 'Não foi possível atualizar.', 'error');
        }
    };

    const handleCancel = async (id: string) => {
        try {
            const res = await fetch(`/api/atendimentos?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelado' })
            });

            if (res.ok) {
                showToast('Cancelado', 'Atendimento cancelado.', 'success');
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
        const colors: any = {
            agendado: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            confirmado: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            em_andamento: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            concluido: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            cancelado: 'text-red-400 bg-red-500/10 border-red-500/20',
        };
        return colors[status] || 'text-slate-400 bg-slate-500/10 border-white/5';
    };

    return (
        <main className="w-full p-4 lg:p-8">
            <div className="flex justify-between items-start mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Atendimentos</h1>
                    <p className="text-slate-400">Gerencie os serviços em andamento e finalizados</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden lg:block">
                        <UserProfile size="md" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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

                <div className="relative flex-1 w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente ou veículo..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredAtendimentos.map(atendimento => (
                    <div key={atendimento.id} className="glass-effect rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600`}>
                                    {atendimento.clienteNome.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{atendimento.clienteNome}</h3>
                                    <p className="text-sm text-slate-400 flex items-center gap-2">
                                        <Car className="w-4 h-4" /> {atendimento.veiculo}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(atendimento.status)} uppercase tracking-wider`}>
                                    {atendimento.status.replace('_', ' ')}
                                </span>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-400">Total</p>
                                    <p className="text-lg font-bold text-white">R$ {atendimento.valorTotal.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {atendimento.status === 'em_andamento' && (
                                    <button
                                        onClick={() => handleStatusChange(atendimento.id, 'concluido')}
                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Finalizar
                                    </button>
                                )}
                                <button
                                    onClick={() => router.push(`/atendimentos/${atendimento.id}`)}
                                    className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-slate-500 hover:text-white">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Cancelar Atendimento"
                message="Deseja realmente cancelar este atendimento?"
                onConfirm={() => atendimentoToDelete && handleCancel(atendimentoToDelete)}
                onCancel={() => setShowDeleteConfirm(false)}
                type="danger"
            />

            <Toast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </main>
    );
}
