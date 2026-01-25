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

interface NovoAtendimentoClientProps {
    initialClientes: Cliente[];
    initialServicos: Servico[];
    initialAtendimento?: any;
}

export default function NovoAtendimentoClient({
    initialClientes,
    initialServicos,
    initialAtendimento
}: NovoAtendimentoClientProps) {
    const router = useRouter();

    // Dados
    const [clientes] = useState<Cliente[]>(initialClientes);
    const [servicos] = useState<Servico[]>(initialServicos);

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

    // UI Toast
    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    // Preencher dados se for edição (usa initialAtendimento do servidor)
    useEffect(() => {
        if (initialAtendimento) {
            setEditingId(initialAtendimento.id);

            // 1. Cliente
            const foundCliente = clientes.find(c => c.id === initialAtendimento.clienteId);
            if (foundCliente) {
                setClienteSelecionado(foundCliente);

                // 2. Veiculo
                if (initialAtendimento.veiculoId) {
                    const v = foundCliente.veiculos?.find((v: any) => v.id === initialAtendimento.veiculoId);
                    if (v) setVeiculoSelecionado(v);
                } else if (initialAtendimento.veiculo) {
                    const v = foundCliente.veiculos?.find((v: any) =>
                        `${v.modelo} - ${v.placa}` === initialAtendimento.veiculo
                    );
                    if (v) setVeiculoSelecionado(v);
                }
            }

            // 3. Carrinho
            if (initialAtendimento.servicos && Array.isArray(initialAtendimento.servicos)) {
                const selectedItems: Servico[] = [];
                initialAtendimento.servicos.forEach((atendServ: any) => {
                    const foundInCatalog = servicos.find(s =>
                        s.id === atendServ.id || s.nome === atendServ.nome
                    );
                    if (foundInCatalog) selectedItems.push(foundInCatalog);
                });
                setCarrinho(selectedItems);
            }

            // 4. Outros
            if (initialAtendimento.dataHora) {
                const dt = new Date(initialAtendimento.dataHora);
                setDataAgendamento(dt.toISOString().split('T')[0]);
                setHoraAgendamento(dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            }
            if (initialAtendimento.desconto !== undefined) setDesconto(String(initialAtendimento.desconto));
            if (initialAtendimento.formaPagamento) setFormaPagamento(initialAtendimento.formaPagamento);
        }
    }, [initialAtendimento, clientes, servicos]);

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
                status: editingId ? undefined : 'em_andamento',
                dataHora: `${dataAgendamento}T${horaAgendamento}`
            };

            let res;
            if (editingId) {
                res = await fetch('/api/atendimentos', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingId, ...payload })
                });
            } else {
                res = await fetch('/api/atendimentos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) throw new Error('Falha ao salvar');

            showToast('Sucesso', editingId ? 'Atendimento atualizado!' : 'Atendimento iniciado com sucesso!', 'success');
            setTimeout(() => router.push('/atendimentos'), 1000);

        } catch (error) {
            console.error(error);
            showToast('Erro', 'Erro ao processar solicitação', 'error');
        }
    };

    return (
        <>
            <main className="p-4 lg:p-6 flex flex-col lg:flex-row gap-6 h-screen overflow-hidden">
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-20 lg:pb-0">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{editingId ? 'Editar Atendimento' : 'Iniciar Atendimento'}</h1>
                        <p className="text-slate-400">Gerencie o atendimento do cliente</p>
                    </div>

                    <div className="glass-effect p-6 rounded-2xl animate-slide-up relative z-50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 font-bold">
                                <User className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Cliente</h2>
                        </div>

                        {!clienteSelecionado ? (
                            <div className="relative">
                                <div className="space-y-2">
                                    <label className="text-slate-400 text-sm font-medium ml-1">Selecione o Cliente</label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full flex items-center justify-between px-4 py-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/50 transition-all cursor-pointer"
                                        >
                                            <span className="text-slate-500">Filtrar por nome ou celular...</span>
                                            <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-[-90deg]' : 'rotate-90'}`} />
                                        </div>

                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                                <div className="p-3 border-b border-white/10 sticky top-0 bg-slate-900/95 backdrop-blur-sm">
                                                    <div className="relative text-white">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={buscaCliente}
                                                            onChange={(e) => setBuscaCliente(e.target.value)}
                                                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {clientesFiltrados.map(c => (
                                                        <button
                                                            key={c.id}
                                                            onClick={() => selecionarCliente(c)}
                                                            className="w-full text-left p-4 hover:bg-blue-600/10 border-b border-white/5 flex items-center justify-between group"
                                                        >
                                                            <div>
                                                                <p className="text-white font-medium">{c.nome}</p>
                                                                <p className="text-xs text-slate-500">{c.telefone}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-blue-500/10 border-l-4 border-l-blue-500 p-4 rounded-xl mb-6">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Cliente Selecionado</p>
                                    <p className="text-xl font-bold text-white">{clienteSelecionado.nome} <small className="font-normal opacity-50 px-2">({clienteSelecionado.telefone})</small></p>
                                </div>
                                <button onClick={() => setClienteSelecionado(null)} className="text-sm px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-slate-300">Trocar</button>
                            </div>
                        )}

                        <div className="mt-8 border-t border-white/5 pt-6">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Car className="w-4 h-4 text-slate-500" /> Veículos</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {clienteSelecionado?.veiculos?.length ? (
                                    clienteSelecionado.veiculos.map((v, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setVeiculoSelecionado(v)}
                                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${veiculoSelecionado === v ? 'bg-blue-600 border-transparent shadow-lg scale-[1.02]' : 'bg-white/5 border-white/10 text-slate-300'}`}
                                        >
                                            <p className="font-bold text-lg">{v.modelo}</p>
                                            <p className={`text-xs ${veiculoSelecionado === v ? 'text-blue-100' : 'text-slate-500'}`}>{v.placa}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-6 text-center text-slate-500 text-sm italic">Nenhum veículo cadastrado</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 glass-effect p-4 rounded-2xl">
                            <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">Data</span>
                            <input type="date" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)} className="w-full bg-white/5 border-white/10 rounded-xl px-3 py-2 text-white [color-scheme:dark]" />
                        </div>
                        <div className="flex-1 glass-effect p-4 rounded-2xl">
                            <span className="text-xs font-bold text-slate-500 uppercase mb-2 block">Horário</span>
                            <input type="time" value={horaAgendamento} onChange={e => setHoraAgendamento(e.target.value)} className="w-full bg-white/5 border-white/10 rounded-xl px-3 py-2 text-white [color-scheme:dark]" />
                        </div>
                    </div>

                    <div className="glass-effect p-6 rounded-2xl">
                        <h2 className="text-lg font-semibold text-white mb-6">Catálogo de Serviços</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                            {servicosFiltrados.map(s => (
                                <button key={s.id} onClick={() => adicionarAoCarrinho(s)} className="p-4 bg-white/5 border border-white/5 rounded-xl text-left hover:border-blue-500/50 transition-all">
                                    <h3 className="text-white font-medium">{s.nome}</h3>
                                    <p className="text-green-400 font-bold text-sm mt-1">R$ {s.preco.toFixed(2)}</p>
                                    <p className="text-[10px] text-slate-500 mt-2"><Clock className="inline w-2.5 h-2.5" /> {s.duracao} min</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:w-96 glass-effect p-6 flex flex-col h-full border-l border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6">Resumo</h2>
                    <div className="flex-1 overflow-y-auto space-y-3 mb-6">
                        {carrinho.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-white text-sm font-medium">{it.nome}</p>
                                    <p className="text-xs text-green-400 font-bold">R$ {it.preco.toFixed(2)}</p>
                                </div>
                                <button onClick={() => removerDoCarrinho(idx)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Desconto (R$)</label>
                            <input type="number" value={desconto} onChange={e => setDesconto(e.target.value)} className="w-full bg-white/5 border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-green-500 transition-all" />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Forma de Pagamento</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['pix', 'dinheiro', 'cartao_credito', 'cartao_debito'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFormaPagamento(f as any)}
                                        className={`p-2 text-xs font-bold rounded-lg border transition-all ${formaPagamento === f ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10'}`}
                                    >
                                        {f.replace('_', ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between text-xs text-slate-400"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/5"><span>Total</span><span className="text-green-400">R$ {total.toFixed(2)}</span></div>
                        </div>

                        <button
                            onClick={finalizarAtendimento}
                            disabled={!clienteSelecionado || carrinho.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${(!clienteSelecionado || carrinho.length === 0) ? 'bg-slate-800 text-slate-600' : 'bg-green-500 text-white shadow-lg shadow-green-500/20'}`}
                        >
                            {editingId ? <Save className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                            {editingId ? 'Salvar Alterações' : 'Iniciar Atendimento'}
                        </button>
                    </div>
                </div>
            </main>

            <Toast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
}
