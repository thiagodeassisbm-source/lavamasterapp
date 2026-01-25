'use client';

import { useState, useEffect } from 'react';
import ServicoForm from '@/lib/presentation/components/ServicoForm';
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import UserProfile from '@/lib/presentation/components/UserProfile';
import { Plus, Search, Edit, Trash2, Wrench, DollarSign, Clock } from 'lucide-react';

interface Servico {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    duracao?: number;
    categoria?: string;
}

interface ServicosClientProps {
    initialServicos: Servico[];
}

export default function ServicosClient({ initialServicos }: ServicosClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
    const [servicos, setServicos] = useState<Servico[]>(initialServicos);

    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    const fetchServicos = async () => {
        try {
            const response = await fetch('/api/servicos');
            if (response.ok) {
                const data = await response.json();
                setServicos(data);
            }
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
        }
    };

    const filteredServicos = servicos.filter(servico =>
        servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servico.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveServico = async (data: any) => {
        try {
            const payload = {
                ...data,
                preco: parseFloat(data.preco),
                duracao: data.duracao ? parseInt(data.duracao) : undefined,
            };

            let response;
            if (selectedServico) {
                response = await fetch(`/api/servicos/${selectedServico.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/servicos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (response.ok) {
                showToast('Sucesso', `Serviço ${selectedServico ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
                fetchServicos();
                setShowForm(false);
                setSelectedServico(null);
            } else {
                throw new Error('Falha na operação');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast('Erro', 'Erro ao salvar serviço.', 'error');
        }
    };

    const handleEditServico = (servico: Servico) => {
        setSelectedServico(servico);
        setShowForm(true);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDelete({ isOpen: true, id });
    };

    const executeDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            const response = await fetch(`/api/servicos/${confirmDelete.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast('Sucesso', 'Serviço excluído com sucesso!', 'success');
                fetchServicos();
            } else {
                showToast('Erro', 'Erro ao excluir serviço.', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showToast('Erro', 'Erro ao excluir serviço.', 'error');
        } finally {
            setConfirmDelete({ isOpen: false, id: null });
        }
    };

    return (
        <main className="w-full p-4 lg:p-8">
            <div className="mb-8 animate-slide-down">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Serviços</h1>
                        <p className="text-slate-400">Gerencie os serviços oferecidos</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:block">
                            <UserProfile size="md" />
                        </div>
                        <button
                            onClick={() => {
                                setSelectedServico(null);
                                setShowForm(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg shadow-pink-500/30 flex items-center gap-2 justify-center"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Serviço
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-6 animate-slide-up">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar serviços..."
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Total de Serviços</p>
                            <p className="text-2xl font-bold text-white">{servicos.length}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Preço Médio</p>
                            <p className="text-2xl font-bold text-white">
                                R$ {servicos.length > 0 ? (servicos.reduce((acc, s) => acc + s.preco, 0) / servicos.length).toFixed(0) : '0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Duração Média</p>
                            <p className="text-2xl font-bold text-white">
                                {servicos.length > 0 ? Math.round(servicos.reduce((acc, s) => acc + (s.duracao || 0), 0) / servicos.length) : '0'}min
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {filteredServicos.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 glass-effect rounded-2xl">
                        <Wrench className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Nenhum serviço encontrado</p>
                    </div>
                )}

                {filteredServicos.map((servico, index) => (
                    <div
                        key={servico.id}
                        onClick={() => handleEditServico(servico)}
                        className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                                <Wrench className="w-6 h-6 text-white" />
                            </div>
                            <button
                                onClick={(e) => handleDeleteClick(servico.id, e)}
                                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                title="Excluir"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-2">{servico.nome}</h3>
                        {servico.descricao && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{servico.descricao}</p>}

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div>
                                <p className="text-xs text-slate-400">Preço</p>
                                <p className="text-xl font-bold text-green-400">R$ {servico.preco.toFixed(2)}</p>
                            </div>
                            {servico.duracao && (
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Duração</p>
                                    <p className="text-sm font-semibold text-blue-400">{servico.duracao}min</p>
                                </div>
                            )}
                        </div>

                        {servico.categoria && (
                            <div className="mt-3">
                                <span className="px-3 py-1 rounded-lg bg-pink-500/10 text-xs text-pink-400 border border-pink-500/20">
                                    {servico.categoria}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showForm && (
                <ServicoForm
                    onClose={() => {
                        setShowForm(false);
                        setSelectedServico(null);
                    }}
                    onSave={handleSaveServico}
                    initialData={selectedServico ? {
                        nome: selectedServico.nome,
                        descricao: selectedServico.descricao,
                        preco: selectedServico.preco.toString(),
                        duracao: selectedServico.duracao?.toString(),
                        categoria: selectedServico.categoria,
                    } : undefined}
                />
            )}

            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Excluir Serviço"
                message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                onConfirm={executeDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
            />

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
