'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, FileText, User, Calendar, Plus, Trash2, DollarSign, Car, CheckCircle } from 'lucide-react';

const itemSchema = z.object({
    servicoId: z.string().optional(),
    produtoId: z.string().optional(),
    nome: z.string(),
    quantidade: z.number().min(1, 'Qtd mínima é 1'),
    precoUnitario: z.number().min(0, 'Preço inválido'),
    total: z.number().optional(),
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
    onSave: (data: any) => void;
    initialData?: any;
}

export default function OrcamentoForm({ onClose, onSave, initialData }: OrcamentoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    const [servicosDisponiveis, setServicosDisponiveis] = useState<any[]>([]);
    const [isClienteCadastrado, setIsClienteCadastrado] = useState(true);

    useEffect(() => {
        if (initialData?.clienteNome && (!initialData.clienteId || initialData.clienteId === '0')) {
            setIsClienteCadastrado(false);
        }
    }, [initialData]);

    const [selectedCliente, setSelectedCliente] = useState<any>(null);
    const [selectedVeiculo, setSelectedVeiculo] = useState<any>(null);

    // Carregar Clientes e Serviços
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resCli, resServ] = await Promise.all([
                    fetch('/api/clientes'),
                    fetch('/api/servicos')
                ]);
                if (resCli.ok) setClientes(await resCli.json());
                if (resServ.ok) setServicosDisponiveis(await resServ.json());
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, []);

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
            veiculo: initialData?.veiculo || '',
            dataValidade: initialData?.dataValidade || defaultValidadeStr,
            observacoes: initialData?.observacoes || '',
            status: initialData?.status || 'pendente',
            itens: initialData?.itens || [],
            desconto: initialData?.desconto || 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'itens',
    });

    const watchItens = watch('itens');
    const watchDesconto = watch('desconto') || 0;

    const subtotal = watchItens?.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0) || 0;
    const totalFinal = Math.max(0, subtotal - watchDesconto);

    const handleClienteChange = (e: any) => {
        const id = e.target.value;
        const cli = clientes.find(c => c.id === id);
        if (cli) {
            setSelectedCliente(cli);
            setValue('clienteNome', cli.nome);
            if (cli.veiculos?.length === 1) {
                const v = cli.veiculos[0];
                setSelectedVeiculo(v);
                setValue('veiculo', `${v.modelo} - ${v.placa}`);
            }
        }
    };

    const handleToggleService = (servico: any) => {
        const idx = fields.findIndex(f => f.servicoId === servico.id);
        if (idx >= 0) remove(idx);
        else {
            append({
                servicoId: servico.id,
                nome: servico.nome,
                quantidade: 1,
                precoUnitario: servico.preco,
                total: servico.preco
            });
        }
    };

    const onSubmit = async (formData: OrcamentoFormData) => {
        setIsSubmitting(true);
        try {
            // Recalcular totais antes de enviar para garantir que não vá zero
            const finalData = {
                ...formData,
                valorTotal: subtotal,
                valorFinal: totalFinal,
                itens: formData.itens.map(it => ({
                    ...it,
                    total: it.quantidade * it.precoUnitario
                }))
            };
            await onSave(finalData);
            onClose();
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-effect rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-white/10 p-6 flex-shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-orange-500" />
                        <h2 className="text-xl font-bold text-white">Orçamento</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-white font-semibold">Cliente</h3>
                                    <button type="button" onClick={() => setIsClienteCadastrado(!isClienteCadastrado)} className="text-xs text-orange-400 underline">
                                        {isClienteCadastrado ? 'Não cadastrado?' : 'Buscar cadastrado'}
                                    </button>
                                </div>
                                {isClienteCadastrado ? (
                                    <select {...register('clienteId')} onChange={handleClienteChange} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white">
                                        <option value="">Selecione...</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                ) : (
                                    <input {...register('clienteNome')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white" placeholder="Nome do cliente" />
                                )}
                                <input {...register('veiculo')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white" placeholder="Veículo (Modelo - Placa)" />
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-white font-semibold mb-4">Serviços</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                    {servicosDisponiveis.map(s => (
                                        <button key={s.id} type="button" onClick={() => handleToggleService(s)}
                                            className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${fields.some(f => f.servicoId === s.id) ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/20'}`}>
                                            <div><p className="text-white text-sm font-medium">{s.nome}</p><p className="text-xs text-slate-400">R$ {Number(s.preco).toFixed(2)}</p></div>
                                            {fields.some(f => f.servicoId === s.id) && <CheckCircle className="w-4 h-4 text-orange-500" />}
                                        </button>
                                    ))}
                                </div>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg mb-2">
                                        <p className="flex-1 text-white text-sm truncate">{field.nome}</p>
                                        <input type="number" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} className="w-16 p-1 bg-slate-800 rounded text-center text-white text-sm" />
                                        <input type="number" {...register(`itens.${index}.precoUnitario`, { valueAsNumber: true })} step="0.01" className="w-20 p-1 bg-slate-800 rounded text-right text-white text-sm" />
                                        <button type="button" onClick={() => remove(index)} className="p-1 text-red-400"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>

                            {/* Campo de Observações Restaurado */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Observações</label>
                                <textarea
                                    {...register('observacoes')}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                                    placeholder="Observações adicionais para este orçamento..."
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                                <div><label className="text-xs text-slate-400">Validade</label><input type="date" {...register('dataValidade')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white" /></div>
                                <div><label className="text-xs text-slate-400">Status</label><select {...register('status')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white"><option value="pendente">Pendente</option><option value="aprovado">Aprovado</option><option value="rejeitado">Rejeitado</option></select></div>
                            </div>
                            <div className="bg-slate-900 rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
                                <div className="flex justify-between text-slate-400 text-sm"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center text-slate-400 text-sm"><span>Desconto</span><input type="number" {...register('desconto', { valueAsNumber: true })} step="0.01" className="w-20 p-1 bg-white/5 rounded text-right text-white" /></div>
                                <div className="border-t border-white/10 pt-4 flex justify-between text-white font-bold text-lg"><span>Total</span><span className="text-green-400">R$ {totalFinal.toFixed(2)}</span></div>
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                    Salvar Orçamento
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
