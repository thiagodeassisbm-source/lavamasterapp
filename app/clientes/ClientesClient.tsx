'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ClienteForm from '@/lib/presentation/components/ClienteForm';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import {
    Plus,
    Search,
    Trash2,
    Phone,
    User,
    Car,
} from 'lucide-react';
import UserProfile from '@/lib/presentation/components/UserProfile';
import DebugScript from './DebugScript';

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

interface ClientesClientProps {
    initialClientes: Cliente[];
}

export default function ClientesClient({ initialClientes }: ClientesClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
    const [isLoading, setIsLoading] = useState(false);
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

    // Verificar params na URL
    useEffect(() => {
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
                router.replace('/clientes');
            }
        }
    }, [searchParams, router]);

    const fetchClientes = async () => {
        try {
            const response = await fetch('/api/clientes');
            if (response.ok) {
                const data = await response.json();
                setClientes(data);
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    };

    const handleSaveCliente = async (data: any) => {
        try {
            let response;
            if (selectedCliente) {
                response = await fetch(`/api/clientes/${selectedCliente.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...data, id: selectedCliente.id }),
                });
            } else {
                response = await fetch('/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }

            if (response.ok) {
                const updatedOrCreatedCliente = await response.json();
                if (pendingOrcamentoId) {
                    await fetch(`/api/orcamentos/${pendingOrcamentoId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clienteId: updatedOrCreatedCliente.id,
                            cliente: updatedOrCreatedCliente.nome
                        })
                    });
                    router.push('/orcamentos');
                }
                await fetchClientes();
                setShowForm(false);
                setSelectedCliente(null);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
        }
    };

    const handleEditCliente = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setShowForm(true);
    };

    const openDeleteConfirm = (cliente: Cliente) => {
        setConfirmDelete({
            isOpen: true,
            clienteId: cliente.id,
            clienteNome: cliente.nome
        });
    };

    const executeDelete = async () => {
        const id = confirmDelete.clienteId;
        setConfirmDelete({ isOpen: false, clienteId: '', clienteNome: '' });
        try {
            const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchClientes();
                setToast({
                    isOpen: true,
                    type: 'success',
                    title: 'Excluído com Sucesso!',
                    message: 'O cliente foi removido do sistema.'
                });
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    };

    const filteredClientes = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.telefone.includes(searchTerm) ||
        cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="w-full p-4 lg:p-8">
            <div className="mb-6 animate-slide-down">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Clientes</h1>
                        <p className="text-slate-400">Gerencie seus clientes e histórico de serviços</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden lg:block">
                            <UserProfile size="md" />
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
            </div>

            <div className="mb-6 animate-slide-up">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, telefone ou email..."
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="glass-effect rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
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
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
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
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
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

            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {filteredClientes.length === 0 ? (
                    <div className="glass-effect rounded-2xl p-12 text-center border-2 border-dashed border-white/5">
                        <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Nenhum cliente encontrado</h3>
                        <p className="text-slate-400 mb-6">Comece adicionando seu primeiro cliente</p>
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
                    filteredClientes.map((cliente) => (
                        <div
                            key={cliente.id}
                            onClick={() => handleEditCliente(cliente)}
                            className="glass-effect rounded-2xl p-5 hover:bg-white/10 transition-all group cursor-pointer border border-white/5"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-2">
                                {/* Informações Pessoais + Avatar */}
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                                        <span className="text-xl font-bold text-white">
                                            {cliente.nome.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                            <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                                                {cliente.nome}
                                            </h3>
                                            {/* Tags de Info ao lado do nome em desktop */}
                                            <div className="flex flex-wrap gap-2 text-xs opacity-80 md:opacity-100">
                                                {cliente.cpf && (
                                                    <span className="text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase font-mono tracking-wide hidden md:inline-block">
                                                        CPF: {cliente.cpf}
                                                    </span>
                                                )}
                                                {(cliente.cidade || cliente.estado) && (
                                                    <span className="text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/10 hidden md:inline-block">
                                                        {cliente.cidade}{cliente.estado ? `/${cliente.estado}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                                            <span className="flex items-center gap-1.5 min-w-[120px]">
                                                <Phone className="w-4 h-4 text-green-400" />
                                                {cliente.telefone}
                                            </span>
                                            {cliente.email && (
                                                <span className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-slate-600 hidden md:block" />
                                                    {cliente.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Veículos - Agora fluindo logo após ou ocupando espaço central */}
                                <div className="flex flex-wrap items-center gap-2 md:pl-4 md:border-l md:border-white/10 min-w-[200px]">
                                    {cliente.veiculos && cliente.veiculos.length > 0 ? (
                                        cliente.veiculos.map((veiculo: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/20 transition-colors"
                                            >
                                                <Car className="w-4 h-4 text-blue-400" />
                                                <div className="flex flex-col leading-none">
                                                    <span className="text-sm text-slate-200 font-bold">
                                                        {veiculo.modelo}
                                                    </span>
                                                    {veiculo.placa && (
                                                        <span className="text-[10px] text-blue-400/80 font-mono tracking-wider uppercase">
                                                            {veiculo.placa}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-600 italic px-2">
                                            <Car className="w-4 h-4 opacity-40" />
                                            <span className="text-sm">Sem veículo</span>
                                        </div>
                                    )}
                                </div>

                                {/* Ações */}
                                <div className="flex justify-end md:ml-auto pl-4 border-l border-white/5 md:border-none">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteConfirm(cliente);
                                        }}
                                        className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-x-2 md:group-hover:translate-x-0"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

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

            <Toast
                isOpen={toast.isOpen}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                onClose={() => setToast({ ...toast, isOpen: false })}
            />
            <DebugScript />
            {/* Debug Info */}
            <div className="fixed bottom-0 left-0 w-full bg-red-900/90 text-white p-2 text-xs font-mono z-[9999] pointer-events-none opacity-75">
                DEBUG: Screen Width: <span id="debug-width">0</span>px |
                Main Container: w-full |
                List Layout: Flex |
                Check if 'formulario' refers to Modal (Fixed) or List (Flex) |
                ClientLayout: lg:ml-72
            </div>

        </main>
    );
}
