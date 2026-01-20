'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, FileText, User, Calendar, Plus, Trash2, DollarSign, Car, CheckCircle } from 'lucide-react';

const itemSchema = z.object({
    servicoId: z.string().min(1, 'Selecione um serviço'),
    nome: z.string(),
    quantidade: z.number().min(1, 'Qtd mínima é 1'),
    precoUnitario: z.number().min(0, 'Preço inválido'),
    total: z.number(),
});

const orcamentoSchema = z.object({
    clienteId: z.string().min(1, 'Selecione um cliente'),
    clienteNome: z.string().optional(),
    veiculo: z.string().optional(),
    dataValidade: z.string().min(1, 'Data de validade é obrigatória'),
    observacoes: z.string().optional(),
    status: z.enum(['pendente', 'aprovado', 'rejeitado', 'expirado']),
    itens: z.array(itemSchema).min(1, 'Adicione pelo menos um item'),
    desconto: z.number().min(0).default(0),
});

type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

interface OrcamentoFormProps {
    onClose: () => void;
    onSave: (data: OrcamentoFormData) => void;
    initialData?: Partial<OrcamentoFormData>;
}



export default function OrcamentoForm({ onClose, onSave, initialData }: OrcamentoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [isClienteCadastrado, setIsClienteCadastrado] = useState(true);

    // Se initialData.clienteId for '0' ou vazio e tivermos clienteNome, assumimos que é não cadastrado
    useEffect(() => {
        if (initialData?.clienteNome && (!initialData.clienteId || initialData.clienteId === '0')) {
            setIsClienteCadastrado(false);
        }
    }, [initialData]);

    const [selectedCliente, setSelectedCliente] = useState<any>(null);
    const [selectedVeiculo, setSelectedVeiculo] = useState<any>(
        initialData?.veiculo && typeof initialData.veiculo !== 'string' ? initialData.veiculo : null
    );

    // Fetch Clientes Real
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const res = await fetch('/api/clientes');
                if (res.ok) {
                    const data = await res.json();
                    setClientes(data);
                }
            } catch (error) {
                console.error('Erro ao buscar clientes:', error);
            }
        };
        fetchClientes();
    }, []);

    // Hydration Effect
    useEffect(() => {
        if (clientes.length > 0 && initialData && initialData.clienteId && initialData.clienteId !== '0') {
            const cliente = clientes.find(c => c.id === initialData.clienteId);
            if (cliente) {
                handleClienteChange({ target: { value: cliente.id } } as any);
            }
        }
    }, [clientes, initialData]);

    // Calcular data de validade padrão (7 dias)
    const defaultValidade = new Date();
    defaultValidade.setDate(defaultValidade.getDate() + 7);
    const defaultValidadeStr = defaultValidade.toISOString().split('T')[0];

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<OrcamentoFormData>({
        resolver: zodResolver(orcamentoSchema) as any,
        defaultValues: {
            clienteId: initialData?.clienteId || (isClienteCadastrado ? '' : '0'),
            clienteNome: initialData?.clienteNome || '',
            veiculo: typeof initialData?.veiculo === 'string' ? initialData.veiculo : '',
            dataValidade: initialData?.dataValidade || defaultValidadeStr,
            observacoes: initialData?.observacoes || '',
            status: (initialData?.status as OrcamentoFormData['status']) || 'pendente',
            itens: initialData?.itens || [],
            desconto: initialData?.desconto ?? 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'itens',
    });

    const watchItens = watch('itens');
    const watchDesconto = watch('desconto');

    // Mocks de serviços para os cards 
    // (Poderia vir de props ou context se necessário, mas mantendo a consistência com AgendamentoForm)
    const servicosDisponiveis = [
        { id: '1', nome: 'Lavagem Completa', preco: 80 },
        { id: '2', nome: 'Polimento', preco: 250 },
        { id: '3', nome: 'Cristalização', preco: 350 },
        { id: '4', nome: 'Vitrificação', preco: 800 },
        { id: '5', nome: 'Higienização Interna', preco: 150 },
    ];

    // Cálculos de totais
    const subtotal = watchItens?.reduce((acc, item) => {
        return acc + (item.quantidade * item.precoUnitario);
    }, 0) || 0;

    const totalFinal = Math.max(0, subtotal - (watchDesconto || 0));

    // Atualizar dados do cliente quando selecionado
    const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clienteId = e.target.value;
        const cliente = clientes.find(c => c.id === clienteId);

        if (cliente) {
            setSelectedCliente(cliente);
            setValue('clienteNome', cliente.nome);
            setValue('clienteId', clienteId); // Garante que o ID vai pro form

            // Se tiver apenas um veículo, seleciona automaticamente
            if (cliente.veiculos && cliente.veiculos.length === 1) {
                const veiculo = cliente.veiculos[0];
                handleVeiculoSelect(veiculo);
            } else {
                setSelectedVeiculo(null);
                setValue('veiculo', '');
            }
        } else {
            setSelectedCliente(null);
            setSelectedVeiculo(null);
            setValue('clienteNome', '');
            setValue('veiculo', '');
        }
    };

    const handleVeiculoSelect = (veiculo: any) => {
        setSelectedVeiculo(veiculo);
        setValue('veiculo', `${veiculo.modelo} - ${veiculo.placa}`);
    };

    const handleToggleService = (servico: typeof servicosDisponiveis[0]) => {
        const existingIndex = fields.findIndex(f => f.servicoId === servico.id);

        if (existingIndex >= 0) {
            remove(existingIndex);
        } else {
            append({
                servicoId: servico.id,
                nome: servico.nome,
                quantidade: 1,
                precoUnitario: servico.preco,
                total: servico.preco,
            });
        }
    };

    const toggleMode = () => {
        const newMode = !isClienteCadastrado;
        setIsClienteCadastrado(newMode);

        // Resetar campos ao trocar de modo
        setSelectedCliente(null);
        setSelectedVeiculo(null);
        setValue('clienteId', newMode ? '' : '0'); // '0' indica cliente não cadastrado
        setValue('clienteNome', '');
        setValue('veiculo', '');
    };

    const onSubmit = async (data: OrcamentoFormData) => {
        setIsSubmitting(true);
        try {
            await onSave(data);
            onClose();
        } catch (error) {
            console.error('Erro ao salvar orçamento:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-effect rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl animate-scale-in flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-white/10 p-6 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {initialData ? 'Editar Orçamento' : 'Novo Orçamento'}
                                </h2>
                                <p className="text-slate-400 text-sm">Preencha os dados da proposta</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit(onSubmit as any)} className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Coluna Principal (2/3) - Dados e Itens */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Dados do Cliente */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <User className="w-5 h-5 text-orange-400" />
                                        Dados do Cliente
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={toggleMode}
                                        className="text-xs text-orange-400 hover:text-orange-300 underline underline-offset-2"
                                    >
                                        {isClienteCadastrado ? 'Cliente não cadastrado?' : 'Selecionar cliente cadastrado'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {isClienteCadastrado ? (
                                        // MODO: Cliente Cadastrado
                                        <>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Cliente *</label>
                                                <select
                                                    {...register('clienteId')}
                                                    onChange={(e) => {
                                                        register('clienteId').onChange(e);
                                                        handleClienteChange(e);
                                                    }}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
                                                >
                                                    <option value="" className="bg-slate-800 text-white">Selecione um cliente</option>
                                                    {clientes.map(cliente => (
                                                        <option key={cliente.id} value={cliente.id} className="bg-slate-800 text-white">
                                                            {cliente.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.clienteId && (
                                                    <p className="text-red-400 text-sm mt-1">{errors.clienteId.message}</p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Veículo</label>
                                                {!selectedCliente ? (
                                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-center text-sm">
                                                        Selecione um cliente para ver os veículos
                                                    </div>
                                                ) : selectedVeiculo ? (
                                                    <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-4 transition-all hover:border-orange-500/50">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                                                    <Car className="w-5 h-5 text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-white">{selectedVeiculo.modelo}</h4>
                                                                    <p className="text-sm text-slate-400">{selectedVeiculo.placa} • {selectedVeiculo.cor}</p>
                                                                </div>
                                                            </div>
                                                            {selectedCliente.veiculos && selectedCliente.veiculos.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedVeiculo(null);
                                                                        setValue('veiculo', '');
                                                                    }}
                                                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors border border-white/5"
                                                                >
                                                                    Trocar
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                                            <Car className="w-24 h-24 rotate-12" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {selectedCliente.veiculos && selectedCliente.veiculos.map((v: any) => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => handleVeiculoSelect(v)}
                                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all text-left group"
                                                            >
                                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                                                    <Car className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-white text-sm">{v.modelo}</p>
                                                                    <p className="text-xs text-slate-400">{v.placa}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <input type="hidden" {...register('veiculo')} />
                                                <input type="hidden" {...register('clienteNome')} />
                                            </div>
                                        </>
                                    ) : (
                                        // MODO: Cliente Não Cadastrado
                                        <>
                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Cliente *</label>
                                                <input
                                                    {...register('clienteNome')}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    placeholder="Digite o nome..."
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">Veículo</label>
                                                <input
                                                    {...register('veiculo')}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    placeholder="Modelo - Placa"
                                                />
                                            </div>
                                            {/* Campo oculto para satisfazer o schema, pode ser um ID coringa como '0' */}
                                            <input type="hidden" {...register('clienteId')} value="0" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Serviços */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                    Serviços
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                    {servicosDisponiveis.map(servico => {
                                        const isSelected = fields.some(f => f.servicoId === servico.id);
                                        return (
                                            <button
                                                key={servico.id}
                                                type="button"
                                                onClick={() => handleToggleService(servico)}
                                                className={`
                                                  p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between group
                                                  ${isSelected
                                                        ? 'border-orange-500 bg-orange-500/10'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                    }
                                                `}
                                            >
                                                <div>
                                                    <p className={`font-semibold ${isSelected ? 'text-orange-400' : 'text-white'}`}>{servico.nome}</p>
                                                    <p className="text-sm text-slate-400">R$ {servico.preco.toFixed(2)}</p>
                                                </div>
                                                <div className={`
                                                    w-6 h-6 rounded-full flex items-center justify-center border transition-colors
                                                    ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-white/20 group-hover:border-white/40'}
                                                `}>
                                                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Lista de Itens Adicionados (para ajustar quantidade/preço) */}
                                {fields.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-white/10">
                                        <h4 className="text-sm font-medium text-slate-400 mb-2">Itens Selecionados</h4>
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-white/10 transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">{field.nome}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 px-1">Qtd</span>
                                                        <input
                                                            type="number"
                                                            {...register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                                                            className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                                                            min="1"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 px-1">Preço (R$)</span>
                                                        <input
                                                            type="number"
                                                            {...register(`itens.${index}.precoUnitario`, { valueAsNumber: true })}
                                                            className="w-24 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-right focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
                                                            min="0"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(index)}
                                                        className="p-2 mt-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {errors.itens && (
                                    <p className="text-red-400 text-sm mt-2">{errors.itens.message}</p>
                                )}
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Observações</label>
                                <textarea
                                    {...register('observacoes')}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Observações internas ou para o cliente..."
                                />
                            </div>
                        </div>

                        {/* Coluna Lateral (1/3) - Resumo e Config */}
                        <div className="space-y-6">
                            {/* Datas e Status */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-400" />
                                    Detalhes
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Validade *</label>
                                        <input
                                            {...register('dataValidade')}
                                            type="date"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        />
                                        {errors.dataValidade && (
                                            <p className="text-red-400 text-sm mt-1">{errors.dataValidade.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                                        <select
                                            {...register('status')}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                                        >
                                            <option value="pendente" className="bg-slate-800 text-white">Pendente</option>
                                            <option value="aprovado" className="bg-slate-800 text-white">Aprovado</option>
                                            <option value="rejeitado" className="bg-slate-800 text-white">Rejeitado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Resumo Financeiro */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-white/10 shadow-xl">
                                <h3 className="text-lg font-semibold text-white mb-6">Resumo</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Subtotal</span>
                                        <span>R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400">
                                        <span>Desconto</span>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                {...register('desconto', { valueAsNumber: true })}
                                                className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded text-right text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="flex justify-between text-white font-bold text-lg">
                                        <span>Total</span>
                                        <span className="text-green-400">R$ {totalFinal.toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Salvar Orçamento
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
