'use client';

import { useState } from 'react';
import { Package, AlertTriangle, TrendingUp, Plus, Edit, Trash2, Search } from 'lucide-react';
import UserProfile from '@/lib/presentation/components/UserProfile';
import ProdutoForm from '@/lib/presentation/components/ProdutoForm';
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';

interface EstoqueClientProps {
    initialProdutos: any[];
}

export default function EstoqueClient({ initialProdutos }: EstoqueClientProps) {
    const [produtos, setProdutos] = useState<any[]>(initialProdutos);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedProduto, setSelectedProduto] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

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

    const fetchProdutos = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/estoque');
            if (response.ok) {
                const data = await response.json();
                setProdutos(data);
            }
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            showToast('Erro', 'Erro ao carregar estoque.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        try {
            const payload = {
                ...data,
                preco: parseFloat(data.preco),
                estoque: parseInt(data.estoque),
                estoqueMin: parseInt(data.estoqueMin)
            };

            let response;
            if (selectedProduto) {
                response = await fetch(`/api/estoque/${selectedProduto.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                response = await fetch('/api/estoque', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (response.ok) {
                showToast('Sucesso', `Produto ${selectedProduto ? 'atualizado' : 'cadastrado'} com sucesso!`, 'success');
                fetchProdutos();
                setShowForm(false);
                setSelectedProduto(null);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha na operação');
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            showToast('Erro', error.message || 'Erro ao salvar produto.', 'error');
        }
    };

    const handleEdit = (produto: any) => {
        setSelectedProduto(produto);
        setShowForm(true);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmDelete({ isOpen: true, id });
    };

    const executeDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            const response = await fetch(`/api/estoque/${confirmDelete.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast('Sucesso', 'Produto excluído com sucesso!', 'success');
                fetchProdutos();
            } else {
                showToast('Erro', 'Erro ao excluir produto.', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showToast('Erro', 'Erro ao excluir produto.', 'error');
        } finally {
            setConfirmDelete({ isOpen: false, id: null });
        }
    };

    const filteredProdutos = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalValor = produtos.reduce((acc, p) => acc + (p.estoque * (p.preco || 0)), 0);
    const produtosBaixoEstoque = produtos.filter(p => p.estoque < (p.estoqueMin || 0)).length;

    return (
        <main className="w-full p-4 lg:p-8">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Estoque</h1>
                        <p className="text-slate-400">Controle de produtos e insumos</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:block">
                            <UserProfile size="md" />
                        </div>
                        <button
                            onClick={() => {
                                setSelectedProduto(null);
                                setShowForm(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Produto
                        </button>
                    </div>
                </div>

                <div className="relative animate-slide-up">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar produtos por nome ou descrição..."
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <Package className="w-12 h-12 text-cyan-400" />
                        <div>
                            <p className="text-slate-400 text-sm">Total Produtos</p>
                            <p className="text-2xl font-bold text-white">{produtos.length}</p>
                        </div>
                    </div>
                </div>
                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <AlertTriangle className="w-12 h-12 text-yellow-400" />
                        <div>
                            <p className="text-slate-400 text-sm">Estoque Baixo</p>
                            <p className="text-2xl font-bold text-white">
                                {produtosBaixoEstoque}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <TrendingUp className="w-12 h-12 text-green-400" />
                        <div>
                            <p className="text-slate-400 text-sm">Valor Total</p>
                            <p className="text-2xl font-bold text-white">
                                R$ {totalValor.toFixed(0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredProdutos.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-slate-400 glass-effect rounded-2xl">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">
                            {searchTerm ? 'Nenhum produto encontrado para sua busca' : 'Nenhum produto cadastrado'}
                        </p>
                    </div>
                )}

                {filteredProdutos.map(produto => (
                    <div
                        key={produto.id}
                        onClick={() => handleEdit(produto)}
                        className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    {produto.nome}
                                    {produto.estoque < (produto.estoqueMin || 0) && (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Estoque Baixo
                                        </span>
                                    )}
                                </h3>
                                {produto.descricao && (
                                    <p className="text-sm text-slate-400 mt-1">{produto.descricao}</p>
                                )}
                                <div className="flex gap-4 mt-2 text-sm">
                                    <span className="text-slate-400">
                                        Estoque: <span className={produto.estoque < (produto.estoqueMin || 0) ? 'text-yellow-400 font-bold' : 'text-green-400 font-bold'}>{produto.estoque}</span>
                                    </span>
                                    <span className="text-slate-400">Mínimo: {produto.estoqueMin || 0}</span>
                                    <span className="text-slate-400">Preço: <span className="text-white font-medium">R$ {Number(produto.preco || 0).toFixed(2)}</span></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleDeleteClick(produto.id, e)}
                                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all opacity-100"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <ProdutoForm
                    onClose={() => setShowForm(false)}
                    onSave={handleSave}
                    initialData={selectedProduto}
                />
            )}

            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Excluir Produto"
                message="Tem certeza que deseja excluir este produto do estoque?"
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
