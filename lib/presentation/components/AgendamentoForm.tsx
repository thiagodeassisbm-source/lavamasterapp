'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Calendar, Clock, User, Car, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Toast, { ToastType } from './Toast';

const agendamentoSchema = z.object({
    clienteId: z.string().optional(),
    novoClienteNome: z.string().optional(),
    dataHora: z.string().min(1, 'Data e hora são obrigatórias'),
    servicos: z.array(z.string()).min(1, 'Selecione pelo menos um serviço'),
    observacoes: z.string().optional(),
    status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado']).default('agendado'),
    veiculoMarca: z.string().optional(),
    veiculoModelo: z.string().optional(),
    veiculoPlaca: z.string().optional(),
}).refine(data => data.clienteId || data.novoClienteNome, {
    message: "Selecione um cliente ou digite o nome de um novo",
    path: ["clienteId"]
});

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

interface AgendamentoFormProps {
    onClose: () => void;
    onSave: (data: AgendamentoFormData) => void;
    initialData?: Partial<AgendamentoFormData>;
}

export default function AgendamentoForm({ onClose, onSave, initialData }: AgendamentoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '',
        message: '',
        type: 'success',
        isOpen: false,
    });

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, isOpen: false }));
    };

    // Dados reais da API
    const [clientes, setClientes] = useState<any[]>([]);
    const [servicosDisponiveis, setServicosDisponiveis] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientesRes, servicosRes] = await Promise.all([
                    fetch('/api/clientes'),
                    fetch('/api/servicos')
                ]);

                if (clientesRes.ok) setClientes(await clientesRes.json());
                if (servicosRes.ok) setServicosDisponiveis(await servicosRes.json());
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, []);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<AgendamentoFormData>({
        resolver: zodResolver(agendamentoSchema) as any,
        defaultValues: initialData || {
            status: 'agendado',
            servicos: [],
            clienteId: '',
            veiculoMarca: '',
            veiculoModelo: '',
            veiculoPlaca: '',
        },
    });

    const [selectedCliente, setSelectedCliente] = useState<any | null>(null);

    // Tentamos reconstruir o veículo selecionado se estivermos editando
    const [selectedVeiculo, setSelectedVeiculo] = useState<any>(null);

    const servicosSelecionados = watch('servicos') || [];

    // Effect para carregar dados iniciais quando os clientes estiverem disponíveis
    useEffect(() => {
        if (clientes.length > 0 && initialData) {
            // 1. Encontrar o Cliente
            const cliente = clientes.find(c => c.id === initialData.clienteId);
            if (cliente) {
                setSelectedCliente(cliente);
                setValue('clienteId', cliente.id);

                // 2. Encontrar o Veículo
                const veiculoStr = (initialData as any).veiculo;
                if (veiculoStr) {
                    const foundVeiculo = cliente.veiculos?.find((v: any) =>
                        `${v.modelo} - ${v.placa}` === veiculoStr
                    );
                    if (foundVeiculo) {
                        handleVeiculoSelect(foundVeiculo);
                    }
                }
            } else if (initialData.clienteId) {
                setValue('clienteId', initialData.clienteId);
            }

            // 3. Mapear Serviços (Nomes -> IDs)
            if (initialData.servicos && Array.isArray(initialData.servicos) && servicosDisponiveis.length > 0) {
                const mappedIds = servicosDisponiveis
                    .filter(s => initialData.servicos!.includes(s.nome) || initialData.servicos!.includes(s.id))
                    .map(s => s.id);
                setValue('servicos', mappedIds);
            }

            // 4. Setar Status
            if (initialData.status) {
                setValue('status', initialData.status as any);
            }

            // 5. Setar Data e Hora (Formatar para datetime-local)
            if (initialData.dataHora) {
                const dt = new Date(initialData.dataHora);
                const offset = dt.getTimezoneOffset() * 60000;
                const localISOTime = new Date(dt.getTime() - offset).toISOString().slice(0, 16);
                setValue('dataHora', localISOTime);
            }

            // 6. Setar Observações
            if ((initialData as any).observacoes) {
                setValue('observacoes', (initialData as any).observacoes);
            }
        }
    }, [clientes, servicosDisponiveis, initialData, setValue]);

    const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clienteId = e.target.value;
        const cliente = clientes.find(c => c.id === clienteId);

        if (cliente) {
            setSelectedCliente(cliente);
            // Se tiver apenas um veículo, seleciona automaticamente
            if (cliente.veiculos?.length === 1) {
                handleVeiculoSelect(cliente.veiculos[0]);
            } else {
                setSelectedVeiculo(null);
                setValue('veiculoMarca', '');
                setValue('veiculoModelo', '');
                setValue('veiculoPlaca', '');
            }
        } else {
            setSelectedCliente(null);
            setSelectedVeiculo(null);
            setValue('veiculoMarca', '');
            setValue('veiculoModelo', '');
            setValue('veiculoPlaca', '');
        }
    };

    const handleVeiculoSelect = (veiculo: any) => {
        setSelectedVeiculo(veiculo);
        setValue('veiculoMarca', veiculo.marca);
        setValue('veiculoModelo', veiculo.modelo);
        setValue('veiculoPlaca', veiculo.placa);
    };

    const toggleServico = (servicoId: string) => {
        const current = servicosSelecionados;
        if (current.includes(servicoId)) {
            setValue('servicos', current.filter(id => id !== servicoId));
        } else {
            setValue('servicos', [...current, servicoId]);
        }
    };

    const calcularTotal = () => {
        return servicosDisponiveis
            .filter(s => servicosSelecionados.includes(s.id))
            .reduce((total, s) => total + (Number(s.preco) || 0), 0);
    };

    const [isNewClient, setIsNewClient] = useState(false);

    const onSubmit = async (data: AgendamentoFormData) => {
        setIsSubmitting(true);
        try {
            let clienteNome = '';
            let clienteId = data.clienteId;

            if (isNewClient && data.novoClienteNome) {
                // Se for novo cliente, mandamos o nome e limpamos o ID
                clienteNome = data.novoClienteNome;
                clienteId = undefined;
            } else {
                // Cliente Existente
                const cliente = clientes.find(c => c.id === data.clienteId);
                clienteNome = cliente ? cliente.nome : 'Cliente';
            }

            // Construir string do veículo
            let veiculo = undefined;
            if (data.veiculoMarca && data.veiculoModelo) {
                veiculo = `${data.veiculoModelo} - ${data.veiculoPlaca || ''}`;
            }

            // Mapear detalhes dos serviços selecionados
            const servicosDetalhes = data.servicos.map(id => {
                const s = servicosDisponiveis.find(sd => sd.id === id);
                return {
                    servicoId: id,
                    nome: s ? s.nome : 'Serviço',
                    preco: s ? Number(s.preco) : 0
                };
            });

            const valorTotal = calcularTotal();

            const dataToSave = {
                clienteId,
                clienteNome,
                dataHora: data.dataHora,
                status: data.status,
                observacoes: data.observacoes,
                veiculo: veiculo,
                veiculoId: selectedVeiculo?.id,
                servicos: servicosDetalhes,
                valorTotal: valorTotal
            };

            await onSave(dataToSave as any);
            setShowSuccess(true);
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            showToast('Erro!', 'Erro ao salvar agendamento. Tente novamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Modal de Sucesso */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-scale-in text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Agendamento Confirmado!</h2>
                        <p className="text-slate-400 mb-6">O agendamento foi salvo com sucesso no sistema.</p>
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/30 text-lg"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <Toast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="glass-effect rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl animate-scale-in bg-slate-900/95">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-white/10 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {initialData ? 'Editar Agendamento' : 'Novo Agendamento'}
                                    </h2>
                                    <p className="text-slate-400 text-sm">Agende um serviço para o cliente</p>
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

                    {/* Form */}
                    <form id="agendamento-form" onSubmit={handleSubmit(onSubmit as any)} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        <div className="space-y-6">
                            {/* Cliente */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-300">
                                        Cliente *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsNewClient(!isNewClient);
                                            setValue('clienteId', '');
                                            setValue('novoClienteNome', '');
                                            setSelectedCliente(null);
                                        }}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                    >
                                        {isNewClient ? 'Selecionar da Lista' : 'Cliente não cadastrado?'}
                                    </button>
                                </div>

                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    {isNewClient ? (
                                        <input
                                            {...register('novoClienteNome')}
                                            placeholder="Nome do novo cliente"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-500"
                                            autoFocus
                                        />
                                    ) : (
                                        <select
                                            {...register('clienteId')}
                                            onChange={(e) => {
                                                register('clienteId').onChange(e);
                                                handleClienteChange(e);
                                            }}
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                        >
                                            <option value="" className="bg-slate-800 text-white">Selecione um cliente</option>
                                            {clientes.map(cliente => (
                                                <option key={cliente.id} value={cliente.id} className="bg-slate-800 text-white">
                                                    {cliente.nome}
                                                </option>
                                            ))}
                                            {initialData?.clienteId && !clientes.find(c => c.id === initialData.clienteId) && (
                                                <option value={initialData.clienteId} className="bg-slate-800 text-white">
                                                    {(initialData as any).clienteNome || 'Cliente não encontrado'}
                                                </option>
                                            )}
                                        </select>
                                    )}
                                </div>
                                {errors.clienteId && !isNewClient && (
                                    <p className="text-red-400 text-sm mt-1">{errors.clienteId.message}</p>
                                )}
                                {errors.novoClienteNome && isNewClient && (
                                    <p className="text-red-400 text-sm mt-1">{errors.novoClienteNome.message}</p>
                                )}
                            </div>

                            {/* Data, Hora e Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Data e Hora */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Data e Hora *
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            {...register('dataHora')}
                                            type="datetime-local"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    {errors.dataHora && (
                                        <p className="text-red-400 text-sm mt-1">{errors.dataHora.message}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Status
                                    </label>
                                    <div className="relative">
                                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <select
                                            {...register('status')}
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                        >
                                            <option value="agendado" className="bg-slate-800 text-white">Agendado</option>
                                            <option value="confirmado" className="bg-slate-800 text-white">Confirmado</option>
                                            <option value="em_andamento" className="bg-slate-800 text-white">Em Andamento</option>
                                            <option value="concluido" className="bg-slate-800 text-white">Concluído</option>
                                            <option value="cancelado" className="bg-slate-800 text-white">Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Veículo */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Car className="w-5 h-5 text-purple-400" />
                                    Veículo
                                </h3>

                                {!selectedCliente ? (
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-center text-sm">
                                        Selecione um cliente para ver os veículos
                                    </div>
                                ) : selectedVeiculo ? (
                                    <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-4 transition-all hover:border-blue-500/50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                    <Car className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white">{selectedVeiculo.modelo}</h4>
                                                    <p className="text-sm text-slate-400">{selectedVeiculo.marca} • {selectedVeiculo.placa}</p>
                                                </div>
                                            </div>

                                            {selectedCliente.veiculos.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVeiculo(null);
                                                        setValue('veiculoMarca', '');
                                                        setValue('veiculoModelo', '');
                                                        setValue('veiculoPlaca', '');
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedCliente.veiculos.map((v: any) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => handleVeiculoSelect(v)}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all text-left group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                                    <Car className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white text-sm">{v.modelo}</p>
                                                    <p className="text-xs text-slate-400">{v.placa}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Campos ocultos para manter compatibilidade com o schema */}
                                <input type="hidden" {...register('veiculoMarca')} />
                                <input type="hidden" {...register('veiculoModelo')} />
                                <input type="hidden" {...register('veiculoPlaca')} />
                            </div>

                            {/* Serviços */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                    Serviços *
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {servicosDisponiveis.map(servico => (
                                        <button
                                            key={servico.id}
                                            type="button"
                                            onClick={() => toggleServico(servico.id)}
                                            className={`
                      p-4 rounded-xl border-2 transition-all text-left
                      ${servicosSelecionados.includes(servico.id)
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                                }
                    `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-white">{servico.nome}</p>
                                                    <p className="text-sm text-slate-400">
                                                        R$ {servico.preco.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${servicosSelecionados.includes(servico.id)
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-slate-400'
                                                    }
                      `}>
                                                    {servicosSelecionados.includes(servico.id) && (
                                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {errors.servicos && (
                                    <p className="text-red-400 text-sm mt-2">{errors.servicos.message}</p>
                                )}

                                {/* Total */}
                                {servicosSelecionados.length > 0 && (
                                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-300 font-medium">Valor Total:</span>
                                            <span className="text-2xl font-bold text-green-400">
                                                R$ {calcularTotal().toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Observações */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-orange-400" />
                                    Observações
                                </h3>
                                <textarea
                                    {...register('observacoes')}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Informações adicionais sobre o agendamento..."
                                />
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-white/10 p-6 bg-white/5">
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="agendamento-form"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Confirmar Agendamento
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
