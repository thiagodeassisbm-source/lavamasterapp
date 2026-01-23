'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import {
    Search,
    User,
    Car,
    Plus,
    ShoppingCart,
    Trash2,
    CheckCircle,
    Clock,
    DollarSign,
    ChevronRight,
    Wrench,
    Calendar,
    CreditCard,
    Wallet,
    QrCode,
    Percent,
    Save,
} from 'lucide-react';

interface Cliente {
    id: string;
    nome: string;
    telefone: string;
    veiculos?: any[];
}

interface Servico {
    id: string;
    nome: string;
    preco: number;
    duracao?: number;
    categoria?: string;
    descricao?: string;
}

export default function NovoAtendimentoPage() {
    const router = useRouter();
    // Dados
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados de Seleção
    const [buscaCliente, setBuscaCliente] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState<any | null>(null);
    const [buscaServico, setBuscaServico] = useState('');
    const [carrinho, setCarrinho] = useState<Servico[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Novos Estados
    const [dataAgendamento, setDataAgendamento] = useState(new Date().toISOString().split('T')[0]);
    const [horaAgendamento, setHoraAgendamento] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const [desconto, setDesconto] = useState('');
    const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito'>('pix');

    // UI
    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    // Fetch inicial
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resClientes, resServicos] = await Promise.all([
                    fetch('/api/clientes'),
                    fetch('/api/servicos')
                ]);

                let clientesData: Cliente[] = [];
                let servicosData: Servico[] = [];

                if (resClientes.ok) {
                    clientesData = await resClientes.json();
                    console.log('Clientes carregados:', clientesData);
                    setClientes(clientesData);
                }
                if (resServicos.ok) {
                    servicosData = await resServicos.json();
                    setServicos(servicosData);
                }

                // Check for ID param to load existing data
                const searchParams = new URLSearchParams(window.location.search);
                const atendimentoId = searchParams.get('id');

                if (atendimentoId) {
                    const resAtendimento = await fetch('/api/atendimentos');
                    if (resAtendimento.ok) {
                        const atendimentos = await resAtendimento.json();
                        const atendimento = atendimentos.find((a: any) => a.id === atendimentoId);

                        if (atendimento) {
                            setEditingId(atendimento.id);
                            // Populate state
                            const cliente = clientesData.find(c => c.id === atendimento.clienteId);
                            if (cliente) {
                                setClienteSelecionado(cliente);
                                // Try to match vehicle
                                if (atendimento.veiculoId) {
                                    const veiculo = cliente.veiculos?.find((v: any) => v.id === atendimento.veiculoId);
                                    if (veiculo) setVeiculoSelecionado(veiculo);
                                } else if (atendimento.veiculo) {
                                    // Fallback if veiculoId is missing but we have string
                                    const veiculo = cliente.veiculos?.find((v: any) =>
                                        `${v.modelo} - ${v.placa}` === atendimento.veiculo
                                    );
                                    if (veiculo) setVeiculoSelecionado(veiculo);
                                }
                            }

                            // Populate cart (using servicosNomes or servicos array from DB)
                            const servicosNamesToFind = atendimento.servicosNomes ||
                                (atendimento.servicos ? atendimento.servicos.map((s: any) => s.servico?.nome) : []);

                            if (servicosNamesToFind && servicosNamesToFind.length > 0) {
                                const items = servicosNamesToFind.map((nomeServico: string) =>
                                    servicosData.find(s => s.nome === nomeServico)
                                ).filter((s: any) => !!s) as Servico[];
                                setCarrinho(items);
                            }

                            // Populate other fields
                            if (atendimento.dataHora) {
                                const dt = new Date(atendimento.dataHora);
                                setDataAgendamento(dt.toISOString().split('T')[0]);
                                setHoraAgendamento(dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                            }

                            if (atendimento.desconto !== undefined) {
                                setDesconto(String(atendimento.desconto));
                            }

                            if (atendimento.formaPagamento) {
                                setFormaPagamento(atendimento.formaPagamento);
                            }
                        }
                    }
                }

            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                showToast('Erro', 'Falha ao carregar dados iniciais', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtros
    const clientesFiltrados = buscaCliente
        ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()))
        : clientes;

    const servicosFiltrados = servicos.filter(s =>
        s.nome.toLowerCase().includes(buscaServico.toLowerCase()) ||
        s.categoria?.toLowerCase().includes(buscaServico.toLowerCase())
    );

    // Ações
    const selecionarCliente = (cliente: Cliente) => {
        setClienteSelecionado(cliente);
        setBuscaCliente('');
        setIsDropdownOpen(false);
        // Seleciona primeiro veículo automaticamente se houver
        if (cliente.veiculos && cliente.veiculos.length > 0) {
            setVeiculoSelecionado(cliente.veiculos[0]);
        } else {
            setVeiculoSelecionado(null);
        }
    };

    const adicionarAoCarrinho = (servico: Servico) => {
        setCarrinho([...carrinho, servico]);
        showToast('Adicionado', `${servico.nome} adicionado ao pedido`, 'success');
    };

    const removerDoCarrinho = (index: number) => {
        const novoCarrinho = [...carrinho];
        novoCarrinho.splice(index, 1);
        setCarrinho(novoCarrinho);
    };

    const subtotal = carrinho.reduce((acc, item) => acc + item.preco, 0);
    const valorDesconto = isNaN(parseFloat(desconto)) ? 0 : parseFloat(desconto);
    const total = Math.max(0, subtotal - valorDesconto);
    const duracaoTotal = carrinho.reduce((acc, item) => acc + (item.duracao || 0), 0);

    const finalizarAtendimento = async () => {
        if (!clienteSelecionado) {
            showToast('Atenção', 'Selecione um cliente para continuar', 'warning');
            return;
        }
        if (carrinho.length === 0) {
            showToast('Atenção', 'Adicione pelo menos um serviço', 'warning');
            return;
        }

        try {
            const payload = {
                clienteId: clienteSelecionado.id,
                clienteNome: clienteSelecionado.nome,
                veiculoId: veiculoSelecionado?.id,
                veiculo: veiculoSelecionado ? `${veiculoSelecionado.modelo || 'Veículo'} - ${veiculoSelecionado.placa || ''}` : undefined,
                servicos: carrinho.map(s => ({
                    servicoId: s.id,
                    nome: s.nome,
                    preco: s.preco
                })),
                valorTotal: total,
                desconto: valorDesconto,
                formaPagamento: formaPagamento,
                status: editingId ? undefined : 'em_andamento', // Only set status on create
                dataHora: `${dataAgendamento}T${horaAgendamento}`
            };

            let res;
            if (editingId) {
                // UPDATE
                res = await fetch('/api/atendimentos', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingId, ...payload })
                });
            } else {
                // CREATE
                res = await fetch('/api/atendimentos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) throw new Error('Falha ao salvar');

            console.log('Operação realizada:', payload);
            showToast('Sucesso', editingId ? 'Atendimento atualizado!' : 'Serviço iniciado com sucesso!', 'success');

            // Limpa tudo e redireciona
            setClienteSelecionado(null);
            setVeiculoSelecionado(null);
            setCarrinho([]);
            setEditingId(null);

            setTimeout(() => {
                router.push('/atendimentos');
            }, 1000);

        } catch (error) {
            console.error(error);
            showToast('Erro', 'Erro ao processar solicitação', 'error');
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950">
            <MobileMenu />

            <main className="flex-1 lg:ml-72 p-4 lg:p-6 flex flex-col lg:flex-row gap-6 h-screen overflow-hidden">

                {/* Left Side - Selection Area */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-20 lg:pb-0">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Iniciar Serviço</h1>
                        <p className="text-slate-400">Selecione cliente e serviços para abrir um novo atendimento</p>
                    </div>

                    {/* Cliente Selection */}
                    <div className="glass-effect p-6 rounded-2xl animate-slide-up relative z-50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <User className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Cliente</h2>
                        </div>

                        {!clienteSelecionado ? (
                            <div className="relative">
                                {/* Custom Select Trigger */}
                                <div className="space-y-2">
                                    <label className="text-slate-400 text-sm font-medium ml-1">Selecione o Cliente</label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full flex items-center justify-between px-4 py-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer"
                                        >
                                            <span className="text-slate-500">Selecione um cliente...</span>
                                            <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-[-90deg]' : 'rotate-90'}`} />
                                        </div>

                                        {/* Dropdown List */}
                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-down-sm">
                                                <div className="p-3 border-b border-white/10 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={buscaCliente}
                                                            onChange={(e) => setBuscaCliente(e.target.value)}
                                                            placeholder="Buscar na lista..."
                                                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {isLoading ? (
                                                        <div className="p-4 text-center text-slate-500">Carregando...</div>
                                                    ) : clientesFiltrados.length > 0 ? (
                                                        clientesFiltrados.map(cliente => (
                                                            <button
                                                                key={cliente.id}
                                                                onClick={() => selecionarCliente(cliente)}
                                                                className="w-full text-left p-4 hover:bg-blue-600/10 border-b border-white/5 last:border-0 flex items-center justify-between group transition-colors"
                                                            >
                                                                <div>
                                                                    <p className="text-white font-medium group-hover:text-blue-400 transition-colors">{cliente.nome}</p>
                                                                    <p className="text-xs text-slate-500">{cliente.telefone}</p>
                                                                </div>
                                                                {cliente.veiculos && cliente.veiculos.length > 0 && (
                                                                    <span className="text-xs bg-white/5 px-2 py-1 rounded text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-300">
                                                                        {cliente.veiculos.length} Veículo(s)
                                                                    </span>
                                                                )}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-slate-500">Nenhum cliente encontrado</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                {/* Selected Client Header */}
                                <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-l-blue-500 p-4 rounded-r-xl mb-6">
                                    <div>
                                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Cliente Selecionado</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xl font-bold text-white">{clienteSelecionado.nome}</p>
                                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                                                {clienteSelecionado.telefone}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setClienteSelecionado(null)}
                                        className="text-sm font-medium px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all border border-white/5 hover:border-white/20"
                                    >
                                        Trocar Cliente
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Fixed Vehicle Section */}
                        <div className="mt-6 border-t border-white/10 pt-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Car className="w-4 h-4 text-slate-300" />
                                Veículos
                            </h3>

                            {!clienteSelecionado ? (
                                <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl bg-white/5 flex flex-col items-center justify-center text-center">
                                    <Car className="w-10 h-10 text-slate-600 mb-2 opacity-50" />
                                    <p className="text-slate-500 font-medium">Aguardando cliente...</p>
                                    <p className="text-xs text-slate-600">Selecione um cliente para ver os veículos</p>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {clienteSelecionado.veiculos && clienteSelecionado.veiculos.length > 0 ? (
                                            clienteSelecionado.veiculos.map((veiculo: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setVeiculoSelecionado(veiculo)}
                                                    className={`
                                                        relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 group overflow-hidden
                                                        ${veiculoSelecionado === veiculo
                                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent shadow-lg shadow-blue-500/25 transform scale-[1.02]'
                                                            : 'bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/10'
                                                        }
                                                    `}
                                                >
                                                    {/* Card Content */}
                                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                                        <Car className="w-24 h-24 transform rotate-12" />
                                                    </div>
                                                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className={`p-3 rounded-xl ${veiculoSelecionado === veiculo ? 'bg-white/20' : 'bg-white/5 group-hover:bg-blue-500/10'}`}>
                                                                <Car className={`w-6 h-6 ${veiculoSelecionado === veiculo ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                                                            </div>
                                                            {veiculoSelecionado === veiculo && (
                                                                <div className="bg-white/20 p-1.5 rounded-full">
                                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className={`text-lg font-bold mb-1 ${veiculoSelecionado === veiculo ? 'text-white' : 'text-slate-200'}`}>
                                                                {veiculo.modelo}
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-sm px-2 py-0.5 rounded border ${veiculoSelecionado === veiculo ? 'border-white/30 text-blue-100 bg-white/10' : 'border-white/10 text-slate-400 bg-white/5'}`}>
                                                                    {veiculo.placa}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 p-8 border border-dashed border-white/10 rounded-2xl text-center bg-white/5">
                                                <Car className="w-10 h-10 mx-auto text-slate-600 mb-3" />
                                                <p className="text-slate-400 font-medium">Nenhum veículo cadastrado</p>
                                                <button className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
                                                    Adicionar veículo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date and Time Selection */}
                    <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
                        <div className="flex-1 glass-effect p-4 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-semibold text-white">Data</span>
                            </div>
                            <input
                                type="date"
                                value={dataAgendamento}
                                onChange={(e) => setDataAgendamento(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                            />
                        </div>
                        <div className="flex-1 glass-effect p-4 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-semibold text-white">Horário</span>
                            </div>
                            <input
                                type="time"
                                value={horaAgendamento}
                                onChange={(e) => setHoraAgendamento(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Serviços Catalog */}
                    <div className="glass-effect p-6 rounded-2xl flex-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Serviços</h2>
                            </div>

                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={buscaServico}
                                    onChange={(e) => setBuscaServico(e.target.value)}
                                    placeholder="Filtrar serviços..."
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                            {servicosFiltrados.map(servico => (
                                <button
                                    key={servico.id}
                                    onClick={() => adicionarAoCarrinho(servico)}
                                    className="group flex flex-col text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all active:scale-95"
                                >
                                    <div className="flex justify-between items-start w-full mb-2">
                                        <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                                            {servico.nome}
                                        </h3>
                                        <span className="text-green-400 font-bold text-sm bg-green-500/10 px-2 py-1 rounded-md">
                                            R$ {servico.preco}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8">
                                        {servico.descricao || 'Sem descrição'}
                                    </p>
                                    <div className="mt-auto flex items-center gap-2 text-xs text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{servico.duracao || '-'} min</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Cart/Checkout */}
                <div className="lg:w-96 glass-effect border-l border-white/5 p-6 flex flex-col animate-slide-left">
                    <div className="flex items-center gap-3 mb-6">
                        <ShoppingCart className="w-6 h-6 text-green-400" />
                        <h2 className="text-xl font-bold text-white">Resumo</h2>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
                        {carrinho.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Seu carrinho está vazio</p>
                            </div>
                        ) : (
                            carrinho.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 animate-fade-in">
                                    <div className="flex-1 min-w-0 mr-3">
                                        <p className="text-white font-medium truncate">{item.nome}</p>
                                        <p className="text-sm text-green-400 font-semibold">R$ {item.preco.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={() => removerDoCarrinho(index)}
                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-auto border-t border-white/10 pt-6 space-y-6">
                        {/* Discount Input */}
                        <div className="space-y-2">
                            <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Desconto (R$)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="number"
                                    value={desconto}
                                    onChange={(e) => setDesconto(e.target.value)}
                                    placeholder="0,00"
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Forma de Pagamento</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'pix', label: 'Pix', icon: QrCode },
                                    { id: 'dinheiro', label: 'Dinheiro', icon: Wallet },
                                    { id: 'cartao_credito', label: 'Crédito', icon: CreditCard },
                                    { id: 'cartao_debito', label: 'Débito', icon: CreditCard },
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setFormaPagamento(method.id as any)}
                                        className={`
                                            flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-all
                                            ${formaPagamento === method.id
                                                ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                                : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        <method.icon className="w-3 h-3" />
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm pt-4 border-t border-white/5">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span>R$ {subtotal.toFixed(2)}</span>
                            </div>
                            {valorDesconto > 0 && (
                                <div className="flex justify-between text-red-400">
                                    <span>Desconto</span>
                                    <span>- R$ {valorDesconto.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-400">
                                <span>Tempo Estimado</span>
                                <span>{duracaoTotal} min</span>
                            </div>
                            <div className="flex justify-between items-center text-white text-xl font-bold pt-2 border-t border-white/5">
                                <span>Total</span>
                                <span className="text-green-400">R$ {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={finalizarAtendimento}
                            disabled={!clienteSelecionado || carrinho.length === 0}
                            className={`
                                w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                                ${(!clienteSelecionado || carrinho.length === 0)
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02] shadow-green-500/25'
                                }
                            `}
                        >
                            {editingId ? <Save className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                            {editingId ? 'Salvar Alterações' : 'Iniciar Serviço'}
                        </button>
                    </div>
                </div>

                {/* DEBUG SECTION */}
                <div className="fixed bottom-0 left-0 bg-black/80 text-green-400 p-2 text-xs font-mono z-[9999] pointer-events-none opacity-50 hover:opacity-100 pointer-events-auto">
                    DEBUG: Clientes: {clientes.length} | Filtrados: {clientesFiltrados.length} | IsLoading: {isLoading ? 'Sim' : 'Não'}
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
