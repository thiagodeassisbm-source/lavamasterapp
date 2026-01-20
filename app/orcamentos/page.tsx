'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import OrcamentoForm from '@/lib/presentation/components/OrcamentoForm';
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import { FileText, Plus, Clock, CheckCircle, XCircle, Edit, Trash2, UserPlus } from 'lucide-react';

export default function OrcamentosPage() {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
    const [orcamentos, setOrcamentos] = useState<any[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [orcamentoToDelete, setOrcamentoToDelete] = useState<string | null>(null);
    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const getStatusColor = (status: string) => {
        const colors = {
            pendente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            aprovado: 'bg-green-500/10 text-green-400 border-green-500/20',
            rejeitado: 'bg-red-500/10 text-red-400 border-red-500/20',
            expirado: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
        return colors[status as keyof typeof colors] || colors.pendente;
    };

    const getStatusIcon = (status: string) => {
        const icons = {
            pendente: <Clock className="w-4 h-4" />,
            aprovado: <CheckCircle className="w-4 h-4" />,
            rejeitado: <XCircle className="w-4 h-4" />,
            expirado: <XCircle className="w-4 h-4" />,
        };
        return icons[status as keyof typeof icons] || icons.pendente;
    };

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, isOpen: false }));
    };

    const [isLoading, setIsLoading] = useState(true);

    const fetchOrcamentos = async () => {
        try {
            const response = await fetch('/api/orcamentos');
            if (response.ok) {
                const data = await response.json();
                setOrcamentos(data);
            } else {
                showToast('Erro', 'Erro ao carregar orçamentos.', 'error');
            }
        } catch (error) {
            console.error('Erro ao buscar orçamentos:', error);
            showToast('Erro', 'Erro de conexão.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrcamentos();
    }, []);

    const handleSave = async (data: any) => {
        try {
            const orcamentoData = {
                cliente: data.clienteNome || 'Novo Cliente',
                clienteId: data.clienteId || '0',
                veiculo: data.veiculo,
                itens: data.itens,
                desconto: data.desconto,
                observacoes: data.observacoes,
                valor: data.itens.reduce((acc: number, item: any) => acc + item.total, 0) - (data.desconto || 0),
                status: data.status,
                data: selectedOrcamento ? selectedOrcamento.data : new Date().toISOString().split('T')[0],
                validade: data.dataValidade
            };

            if (selectedOrcamento) {
                // Editar (PUT)
                const response = await fetch(`/api/orcamentos/${selectedOrcamento.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orcamentoData)
                });

                if (response.ok) {
                    showToast('Sucesso!', 'Orçamento atualizado com sucesso.', 'success');
                    fetchOrcamentos();
                } else {
                    throw new Error('Falha ao atualizar');
                }
            } else {
                // Novo (POST)
                const response = await fetch('/api/orcamentos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orcamentoData)
                });

                if (response.ok) {
                    showToast('Sucesso!', 'Orçamento criado com sucesso.', 'success');
                    fetchOrcamentos();
                } else {
                    throw new Error('Falha ao criar');
                }
            }
            setShowForm(false);
            setSelectedOrcamento(null);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast('Erro', 'Erro ao salvar orçamento.', 'error');
        }
    };

    const handleEdit = (orcamento: any) => {
        setSelectedOrcamento({
            ...orcamento,
            clienteNome: orcamento.cliente,
            clienteId: orcamento.clienteId,
            veiculo: orcamento.veiculo,
            itens: orcamento.itens || [],
            desconto: orcamento.desconto,
            observacoes: orcamento.observacoes,
            dataValidade: orcamento.validade,
        });
        setShowForm(true);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOrcamentoToDelete(id);
        setShowDeleteConfirm(true);
    };

    const handleRegisterClient = (e: React.MouseEvent, orcamento: any) => {
        e.stopPropagation();
        const params = new URLSearchParams();
        params.set('new', 'true');
        params.set('orcamentoId', orcamento.id);
        if (orcamento.cliente) params.set('nome', orcamento.cliente);
        if (orcamento.veiculo) params.set('veiculo', orcamento.veiculo);

        router.push(`/clientes?${params.toString()}`);
    };

    const confirmDelete = async () => {
        if (orcamentoToDelete) {
            try {
                const response = await fetch(`/api/orcamentos/${orcamentoToDelete}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showToast('Excluído!', 'Orçamento excluído com sucesso.', 'success');
                    fetchOrcamentos();
                } else {
                    showToast('Erro', 'Erro ao excluir orçamento.', 'error');
                }
            } catch (error) {
                console.error('Erro ao excluir:', error);
                showToast('Erro', 'Erro ao excluir orçamento.', 'error');
            } finally {
                setShowDeleteConfirm(false);
                setOrcamentoToDelete(null);
            }
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setOrcamentoToDelete(null);
    };

    const totalPendentes = orcamentos.filter(o => o.status === 'pendente').reduce((acc, o) => acc + o.valor, 0);
    const totalAprovados = orcamentos.filter(o => o.status === 'aprovado').reduce((acc, o) => acc + o.valor, 0);

    return (
        <div className="flex min-h-screen">
            <MobileMenu />
            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Orçamentos</h1>
                            <p className="text-slate-400">Gerencie propostas e orçamentos</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedOrcamento(null);
                                setShowForm(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Orçamento
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <FileText className="w-12 h-12 text-orange-400" />
                            <div>
                                <p className="text-slate-400 text-sm">Total</p>
                                <p className="text-2xl font-bold text-white">{orcamentos.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <Clock className="w-12 h-12 text-yellow-400" />
                            <div>
                                <p className="text-slate-400 text-sm">Pendentes</p>
                                <p className="text-2xl font-bold text-white">
                                    {orcamentos.filter(o => o.status === 'pendente').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                            <div>
                                <p className="text-slate-400 text-sm">Aprovados</p>
                                <p className="text-2xl font-bold text-white">
                                    {orcamentos.filter(o => o.status === 'aprovado').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-400 font-bold text-lg">R$</span>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Valor Total</p>
                                <p className="text-xl font-bold text-green-400">
                                    {totalAprovados.toFixed(0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {orcamentos.map(orcamento => (
                        <div
                            key={orcamento.id}
                            onClick={() => handleEdit(orcamento)}
                            className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-white">{orcamento.cliente}</h3>

                                        {/* Status do Cliente (Cadastrado ou não) */}
                                        {(!orcamento.clienteId || orcamento.clienteId === '0' || orcamento.clienteId === '') && (
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300 border border-slate-600">
                                                    Não Cadastrado
                                                </span>
                                                <button
                                                    onClick={(e) => handleRegisterClient(e, orcamento)}
                                                    className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-colors flex items-center gap-1 text-xs font-medium"
                                                    title="Cadastrar Cliente"
                                                >
                                                    <UserPlus className="w-3 h-3" />
                                                    Cadastrar
                                                </button>
                                            </div>
                                        )}

                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(orcamento.status)}`}>
                                            {getStatusIcon(orcamento.status)}
                                            {orcamento.status.charAt(0).toUpperCase() + orcamento.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-slate-400">
                                        <span>Criado: {new Date(orcamento.data).toLocaleDateString('pt-BR')}</span>
                                        <span>Validade: {new Date(orcamento.validade).toLocaleDateString('pt-BR')}</span>
                                        {orcamento.veiculo && <span>• {orcamento.veiculo}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className="text-2xl font-bold text-green-400">
                                        R$ {orcamento.valor.toFixed(2)}
                                    </p>
                                    <button
                                        onClick={(e) => handleDeleteClick(orcamento.id, e)}
                                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-100"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {orcamentos.length === 0 && (
                        <div className="text-center py-12 text-slate-400 glass-effect rounded-2xl">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Nenhum orçamento encontrado</p>
                        </div>
                    )}
                </div>

                {showForm && (
                    <OrcamentoForm
                        onClose={() => {
                            setShowForm(false);
                            setSelectedOrcamento(null);
                        }}
                        onSave={handleSave}
                        initialData={selectedOrcamento}
                    />
                )}

                <ConfirmDialog
                    isOpen={showDeleteConfirm}
                    title="Excluir Orçamento"
                    message="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
                    confirmText="Sim, Excluir"
                    cancelText="Cancelar"
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                    type="danger"
                />

                <Toast
                    isOpen={toast.isOpen}
                    title={toast.title}
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />
            </main>
        </div>
    );
}
