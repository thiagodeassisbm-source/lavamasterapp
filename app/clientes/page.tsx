'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import ClienteForm from '@/lib/presentation/components/ClienteForm';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
    User,
    Car,
} from 'lucide-react';

interface Cliente {
    id: string;
    nome: string;
    cpf?: string;
    telefone: string;
    email?: string;
    cidade?: string;
    estado?: string;
    veiculos?: any[];
}

export default function ClientesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingOrcamentoId, setPendingOrcamentoId] = useState<string | null>(null);

    // Initial pre-filled data for new client
    const [initialFormData, setInitialFormData] = useState<any>(undefined);

    // Toast state
    const [toast, setToast] = useState<{
        isOpen: boolean;
        type: ToastType;
        title: string;
        message?: string;
    }>({ isOpen: false, type: 'success', title: '' });

    // Confirm delete state
    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        clienteId: string;
        clienteNome: string;
    }>({ isOpen: false, clienteId: '', clienteNome: '' });

    // Carregar clientes e verificar params
    useEffect(() => {
        fetchClientes();

        // Check for "new" param to open form automatically
        if (searchParams.get('new') === 'true') {
            const nomeStr = searchParams.get('nome');
            const veiculoStr = searchParams.get('veiculo');
            const orcamentoId = searchParams.get('orcamentoId');

            if (orcamentoId) {
                setPendingOrcamentoId(orcamentoId);
            }

            if (nomeStr) {
                const preFill = {
                    nome: decodeURIComponent(nomeStr),
                    // Tenta extrair info do veículo se vier no formato "Modelo - Placa"
                    veiculos: veiculoStr ? (() => {
                        const vDecoded = decodeURIComponent(veiculoStr);
                        const parts = vDecoded.split(' - ');
                        if (parts.length >= 2) {
                            return [{ marca: 'Outra', modelo: parts[0], placa: parts[1] }];
                        } else {
                            return [{ marca: 'Outra', modelo: vDecoded }];
                        }
                    })() : undefined
                };
                setInitialFormData(preFill);
                setShowForm(true);

                // Limpa os params da URL para não reabrir ao dar refresh
                router.replace('/clientes');
            }
        }
    }, [searchParams, router]);

    const fetchClientes = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/clientes');
            if (response.ok) {
                const data = await response.json();
                setClientes(data);
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCliente = async (data: any) => {
        try {
            let response;
            if (selectedCliente) {
                // Editar
                response = await fetch(`/api/clientes/${selectedCliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, id: selectedCliente.id }),
                });
            } else {
                // Criar
                response = await fetch('/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }

            if (response.ok) {
                const updatedOrCreatedCliente = await response.json();

                // Se houver um orcamento pendente, vincula este novo cliente a ele
                if (pendingOrcamentoId) {
                    try {
                        const orcamentoResponse = await fetch(`/api/orcamentos/${pendingOrcamentoId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                clienteId: updatedOrCreatedCliente.id,
                                cliente: updatedOrCreatedCliente.nome
                            })
                        });

                        if (orcamentoResponse.ok) {
                            setToast({
                                isOpen: true,
                                type: 'success',
                                title: 'Vinculado!',
                                message: 'Cliente vinculado ao orçamento com sucesso.'
                            });
                            // Aguarda um pouco e volta para orçamentos
                            setTimeout(() => {
                                router.push('/orcamentos');
                            }, 1500);
                        }
                    } catch (err) {
                        console.error('Erro ao vincular orçamento:', err);
                    }
                }

                // Apenas atualiza a lista - o popup no ClienteForm vai mostrar "Sucesso"
                // O formulário só fecha quando o usuário clicar OK no popup
                await fetchClientes();
                // NÃO fecha o form aqui - deixa o ClienteForm mostrar o popup de sucesso
            } else {
                let errorMessage = 'Erro ao salvar cliente';
                try {
                    const errorDetails = await response.text();
                    if (errorDetails) {
                        try {
                            const errorJson = JSON.parse(errorDetails);
                            errorMessage = errorJson.error || errorDetails;
                        } catch {
                            errorMessage = errorDetails;
                        }
                    }
                } catch (error) {
                    console.error('Erro ao ler resposta de erro:', error);
                }

                // Limita o tamanho da mensagem caso seja um HTML gigante
                if (errorMessage.length > 300) errorMessage = errorMessage.substring(0, 300) + '...';

                // Lança erro para o ClienteForm saber que falhou
                throw new Error(`Erro (${response.status}): ${errorMessage}`);
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            // Re-lança o erro para o ClienteForm tratar
            throw error;
        }
    };

    const handleEditCliente = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setShowForm(true);
    };

    // Abre o diálogo de confirmação
    const openDeleteConfirm = (cliente: Cliente) => {
        setConfirmDelete({
            isOpen: true,
            clienteId: cliente.id,
            clienteNome: cliente.nome
        });
    };

    // Executa a exclusão após confirmação
    const executeDelete = async () => {
        const id = confirmDelete.clienteId;
        setConfirmDelete({ isOpen: false, clienteId: '', clienteNome: '' });

        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchClientes();
                setToast({
                    isOpen: true,
                    type: 'success',
                    title: 'Excluído com Sucesso!',
                    message: 'O cliente foi removido do sistema.'
                });
            } else {
                const errorData = await response.text();
                let errorMsg = 'Erro ao excluir cliente';
                try {
                    const json = JSON.parse(errorData);
                    errorMsg = json.error || errorData;
                } catch {
                    errorMsg = errorData || 'Erro desconhecido';
                }
                setToast({
                    isOpen: true,
                    type: 'error',
                    title: 'Erro ao Excluir',
                    message: errorMsg
                });
            }
        } catch (error: any) {
            console.error('Erro ao excluir:', error);
            setToast({
                isOpen: true,
                type: 'error',
                title: 'Erro de Conexão',
                message: error.message
            });
        }
    };

    const filteredClientes = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefone.includes(searchTerm) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen">
            <MobileMenu />

            <main className="lg:ml-72 min-h-screen p-6 lg:p-8">
                {/* Header */}
                <div className="mb-6 animate-slide-down">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                Clientes
                            </h1>
                            <p className="text-slate-400">
                                Gerencie seus clientes e histórico de serviços
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedCliente(null);
                                setShowForm(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 justify-center"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Cliente
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6 animate-slide-up">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome, telefone ou email..."
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total de Clientes</p>
                                <p className="text-2xl font-bold text-white">{clientes.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                                <Car className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total de Veículos</p>
                                <p className="text-2xl font-bold text-white">
                                    {clientes.reduce((acc, c) => acc + (c.veiculos?.length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-effect rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                                <Phone className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Total de Telefones</p>
                                <p className="text-2xl font-bold text-white">
                                    {clientes.filter(c => c.telefone).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clientes List */}
                <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {filteredClientes.length === 0 ? (
                        <div className="glass-effect rounded-2xl p-12 text-center">
                            <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Nenhum cliente encontrado
                            </h3>
                            <p className="text-slate-400 mb-6">
                                {searchTerm
                                    ? 'Tente buscar com outros termos'
                                    : 'Comece adicionando seu primeiro cliente'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/30 inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Adicionar Cliente
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredClientes.map((cliente, index) => (
                            <div
                                key={cliente.id}
                                onClick={() => handleEditCliente(cliente)}
                                className="glass-effect rounded-2xl p-5 hover:bg-white/10 transition-all group cursor-pointer"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    {/* Coluna Esquerda - Avatar + Info (4 colunas) */}
                                    <div className="md:col-span-4 flex items-center gap-4 min-w-0">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg font-bold text-white">
                                                {cliente.nome.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-semibold text-white truncate">
                                                {cliente.nome}
                                            </h3>
                                            {cliente.cpf && (
                                                <p className="text-xs text-slate-400">CPF: {cliente.cpf}</p>
                                            )}
                                            <div className="flex flex-wrap gap-3 mt-1 text-xs">
                                                <span className="flex items-center gap-1 text-slate-300">
                                                    <Phone className="w-3 h-3 text-green-400" />
                                                    {cliente.telefone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna Central - Veículos (4 colunas - Centralizado na página) */}
                                    <div className="md:col-span-4 flex items-center justify-center">
                                        {cliente.veiculos && cliente.veiculos.length > 0 ? (
                                            <div className="flex flex-col items-center gap-1.5 w-full max-w-[200px]">
                                                {cliente.veiculos.slice(0, 1).map((veiculo: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20 w-full justify-center"
                                                    >
                                                        <Car className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                                        <div className="text-center truncate">
                                                            <span className="text-white font-medium text-sm">
                                                                {veiculo.marca} {veiculo.modelo}
                                                            </span>
                                                            {veiculo.placa && (
                                                                <span className="text-cyan-400 text-xs font-mono ml-1.5">
                                                                    {veiculo.placa}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {cliente.veiculos.length > 1 && (
                                                    <span className="text-xs text-slate-400">
                                                        +{cliente.veiculos.length - 1} veículo(s)
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50 w-full max-w-[200px]">
                                                <Car className="w-4 h-4 text-slate-500" />
                                                <span className="text-xs text-slate-500 italic">Sem veículo</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Coluna Direita - Actions (4 colunas - Alinhado à direita) */}
                                    <div className="md:col-span-4 flex justify-end gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openDeleteConfirm(cliente);
                                            }}
                                            className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Form Modal */}
            {showForm && (
                <ClienteForm
                    onClose={() => {
                        setShowForm(false);
                        setSelectedCliente(null);
                        setInitialFormData(undefined);
                    }}
                    onSave={handleSaveCliente}
                    initialData={selectedCliente || initialFormData}
                />
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Excluir Cliente"
                message={`Tem certeza que deseja excluir o cliente "${confirmDelete.clienteNome}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
                onConfirm={executeDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, clienteId: '', clienteNome: '' })}
            />

            {/* Toast Popup */}
            <Toast
                isOpen={toast.isOpen}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
        </div>
    );
}
