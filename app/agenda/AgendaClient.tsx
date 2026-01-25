'use client';

import { useState, useEffect } from 'react';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import AgendamentoForm from '@/lib/presentation/components/AgendamentoForm';
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    User,
    Car,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Search,
    MessageCircle
} from 'lucide-react';

interface Agendamento {
    id: string;
    clienteNome: string;
    clienteId?: string;
    cliente?: any; // To access phone
    dataHora: string;
    servicos: string[];
    status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    valorTotal: number;
    veiculo?: string;
}

interface AgendaClientProps {
    initialAgendamentos: Agendamento[];
    initialWhatsappTemplate: string;
}

export default function AgendaClient({ initialAgendamentos, initialWhatsappTemplate }: AgendaClientProps) {
    const [showForm, setShowForm] = useState(false);
    const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [agendamentoToDelete, setAgendamentoToDelete] = useState<string | null>(null);
    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const [agendamentos, setAgendamentos] = useState<Agendamento[]>(initialAgendamentos);
    const [whatsappTemplate, setWhatsappTemplate] = useState(initialWhatsappTemplate);

    const fetchAgendamentos = async () => {
        try {
            const response = await fetch('/api/agendamentos');
            if (response.ok) {
                const data = await response.json();
                setAgendamentos(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, isOpen: false }));
    };

    const handleWhatsApp = (app: Agendamento) => {
        const iphone = app.cliente?.telefone;
        if (!iphone) {
            showToast('Erro', 'Telefone do cliente não encontrado.', 'error');
            return;
        }

        const cleanPhone = iphone.replace(/\D/g, '');
        if (cleanPhone.length < 8) {
            showToast('Erro', 'Telefone inválido.', 'error');
            return;
        }

        const dateObj = new Date(app.dataHora);
        const dataStr = dateObj.toLocaleDateString('pt-BR');
        const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let servicosStr = '';
        if (Array.isArray(app.servicos)) {
            if (typeof app.servicos[0] === 'string') servicosStr = app.servicos.join(', ');
            else servicosStr = app.servicos.map((s: any) => s.nome || s.servico?.nome).join(', ');
        }

        let msg = whatsappTemplate
            .replace('{cliente}', app.clienteNome || 'Cliente')
            .replace('{data}', dataStr)
            .replace('{hora}', horaStr)
            .replace('{servico}', servicosStr || 'Serviços');

        const link = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
        window.open(link, '_blank');
    };

    const handleSaveAgendamento = async (data: any) => {
        try {
            if (selectedAgendamento) {
                const res = await fetch('/api/agendamentos', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedAgendamento.id, ...data })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Erro ao atualizar agendamento');
                }

                showToast('Sucesso!', 'Agendamento atualizado com sucesso.', 'success');
                fetchAgendamentos();
            } else {
                const res = await fetch('/api/agendamentos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Erro ao salvar agendamento');
                }
                fetchAgendamentos();
            }
        } catch (error) {
            console.error('Erro no onSave:', error);
            throw error;
        }
    };

    const handleDeleteAgendamento = (id: string) => {
        setAgendamentoToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (agendamentoToDelete) {
            try {
                const res = await fetch(`/api/agendamentos?id=${agendamentoToDelete}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    showToast('Excluído!', 'Agendamento removido com sucesso.', 'success');
                    fetchAgendamentos();
                } else {
                    const err = await res.json();
                    showToast('Erro', err.error || 'Não foi possível excluir.', 'error');
                }
            } catch (error) {
                showToast('Erro', 'Erro de conexão.', 'error');
            }
            setShowDeleteConfirm(false);
            setAgendamentoToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setAgendamentoToDelete(null);
    };

    const getStatusColor = (status: string) => {
        const colors = {
            agendado: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-800',
            confirmado: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-800',
            em_andamento: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-800',
            concluido: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-800',
            cancelado: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-800',
        };
        return colors[status as keyof typeof colors] || colors.agendado;
    };

    const handleUpdateStatus = async (id: string, newStatus: Agendamento['status']) => {
        try {
            const res = await fetch('/api/atendimentos', { // Usando o endpoint de atendimentos que já trata status
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                showToast('Atualizado!', 'Status do agendamento atualizado com sucesso.', 'success');
                fetchAgendamentos();
            }
        } catch (error) {
            showToast('Erro', 'Não foi possível atualizar o status.', 'error');
        }
    };

    const formatDateTime = (dateTime: string) => {
        const date = new Date(dateTime);
        return {
            date: date.toLocaleDateString('pt-BR'),
            time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const filteredAgendamentos = agendamentos.filter(a => {
        const matchesSearch = a.clienteNome.toLowerCase().includes(searchTerm.toLowerCase());
        let matchesPeriod = true;
        if (dateStart || dateEnd) {
            const agendDate = new Date(a.dataHora);
            agendDate.setHours(0, 0, 0, 0);
            if (dateStart) {
                const start = new Date(dateStart);
                start.setHours(0, 0, 0, 0);
                if (agendDate < start) matchesPeriod = false;
            }
            if (dateEnd) {
                const end = new Date(dateEnd);
                end.setHours(0, 0, 0, 0);
                if (agendDate > end) matchesPeriod = false;
            }
        }
        return matchesSearch && matchesPeriod;
    });

    const agendamentosHojeCount = agendamentos.filter(a => {
        const hoje = new Date().toDateString();
        const agendData = new Date(a.dataHora).toDateString();
        return hoje === agendData;
    }).length;

    return (
        <div className="flex min-h-screen">
            <MobileMenu />

            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8 animate-slide-down">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                Agenda
                            </h1>
                            <p className="text-slate-400">
                                Gerencie seus agendamentos e horários
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedAgendamento(null);
                                setShowForm(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 justify-center"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Agendamento
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-effect rounded-2xl p-6 mb-8 animate-slide-up">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Buscar Cliente
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Nome do cliente..."
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Data Início
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Data Fim
                            </label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        {(searchTerm || dateStart || dateEnd) && (
                            <button
                                onClick={() => { setSearchTerm(''); setDateStart(''); setDateEnd(''); }}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all h-[42px] border border-white/10"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                                <CalendarIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Hoje</p>
                                <p className="text-2xl font-bold text-white">{agendamentosHojeCount}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Confirmados</p>
                                <p className="text-2xl font-bold text-white">
                                    {agendamentos.filter(a => a.status === 'confirmado').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Pendentes</p>
                                <p className="text-2xl font-bold text-white">
                                    {agendamentos.filter(a => a.status === 'agendado').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total</p>
                                <p className="text-2xl font-bold text-white">{agendamentos.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agendamentos List */}
                <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-xl font-bold text-white mb-4">Próximos Agendamentos</h2>

                    {filteredAgendamentos.length === 0 ? (
                        <div className="glass-effect rounded-2xl p-12 text-center">
                            <CalendarIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {agendamentos.length === 0 ? 'Nenhum agendamento' : 'Nenhum agendamento encontrado'}
                            </h3>
                            <p className="text-slate-400 mb-6">
                                {agendamentos.length === 0 ? 'Comece criando seu primeiro agendamento' : 'Tente ajustar seus filtros'}
                            </p>
                            {agendamentos.length === 0 ? (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Criar Agendamento
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setSearchTerm(''); setDateStart(''); setDateEnd(''); }}
                                    className="px-6 py-3 bg-white/5 text-slate-300 font-semibold rounded-xl hover:bg-white/10 transition-all border border-white/10"
                                >
                                    Limpar Filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredAgendamentos.map((agendamento, index) => {
                            const { date, time } = formatDateTime(agendamento.dataHora);

                            return (
                                <div
                                    key={agendamento.id}
                                    onClick={() => {
                                        setSelectedAgendamento(agendamento);
                                        setShowForm(true);
                                    }}
                                    className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Data/Hora */}
                                        <div className="flex items-center gap-4 lg:w-48">
                                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex flex-col items-center justify-center">
                                                <span className="text-xs text-blue-200 font-medium">
                                                    {date.split('/')[0]}
                                                </span>
                                                <span className="text-xl font-bold text-white">
                                                    {date.split('/')[1]}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-400">Horário</p>
                                                <p className="text-lg font-semibold text-white">{time}</p>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                        <User className="w-5 h-5 text-blue-400" />
                                                        {agendamento.clienteNome}
                                                    </h3>
                                                    {agendamento.veiculo && (
                                                        <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                                            <Car className="w-4 h-4" />
                                                            {agendamento.veiculo}
                                                        </p>
                                                    )}
                                                </div>
                                                <div
                                                    className="relative group"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <select
                                                        value={agendamento.status}
                                                        onChange={(e) => handleUpdateStatus(agendamento.id, e.target.value as any)}
                                                        className={`
                                                            appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-semibold 
                                                            bg-gradient-to-r border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900
                                                            ${getStatusColor(agendamento.status)}
                                                        `}
                                                    >
                                                        <option value="agendado">Agendado</option>
                                                        <option value="confirmado">Confirmado</option>
                                                        <option value="em_andamento">Em Andamento</option>
                                                        <option value="concluido">Concluído</option>
                                                        <option value="cancelado">Cancelado</option>
                                                    </select>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {agendamento.servicos.map((servico, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1 rounded-lg bg-white/5 text-sm text-slate-300 border border-white/10"
                                                    >
                                                        {servico}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                                <div className="text-lg font-bold text-green-400">
                                                    R$ {agendamento.valorTotal.toFixed(2)}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleWhatsApp(agendamento);
                                                        }}
                                                        className="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
                                                        title="Confirmar no WhatsApp"
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAgendamento(agendamento.id);
                                                        }}
                                                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                                        title="Cancelar"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Form Modal */}
            {showForm && (
                <AgendamentoForm
                    onClose={() => {
                        setShowForm(false);
                        setSelectedAgendamento(null);
                    }}
                    onSave={handleSaveAgendamento}
                    initialData={selectedAgendamento || undefined}
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Cancelar Agendamento"
                message="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
                confirmText="Sim, Cancelar"
                cancelText="Não, Voltar"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                type="danger"
            />

            {/* Toast Notifications */}
            <Toast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />
        </div>
    );
}
