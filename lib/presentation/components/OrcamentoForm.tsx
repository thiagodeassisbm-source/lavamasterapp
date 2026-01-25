'use client';

import { useState, useEffect, useMemo } from 'react';
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
    const [isMounted, setIsMounted] = useState(false);

    // Evitar erro de Hydration (React error #425)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Determinar se é edição ou novo
    const isEdit = !!initialData?.id;

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<OrcamentoFormData>({
        resolver: zodResolver(orcamentoSchema) as any,
        defaultValues: useMemo(() => ({
            clienteId: initialData?.clienteId || (initialData?.clienteNome ? '0' : ''),
            clienteNome: initialData?.clienteNome || '',
            veiculo: initialData?.veiculo || '',
            dataValidade: initialData?.dataValidade || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            observacoes: initialData?.observacoes || '',
            status: initialData?.status || 'pendente',
            itens: initialData?.itens || [],
            desconto: initialData?.desconto || 0,
        }), [initialData]),
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'itens',
    });

    // Sincronizar estado de cliente cadastrado na edição
    useEffect(() => {
        if (initialData?.clienteNome && (!initialData.clienteId || initialData.clienteId === '0')) {
            setIsClienteCadastrado(false);
        }
    }, [initialData]);

    const [selectedCliente, setSelectedCliente] = useState<any>(null);

    // Carregar dados necessários
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resCli, resServ] = await Promise.all([
                    fetch('/api/clientes'),
                    fetch('/api/servicos')
                ]);
                if (resCli.ok) {
                    const dataCli = await resCli.json();
                    setClientes(dataCli);

                    // Se estiver editando, encontrar o cliente selecionado
                    if (initialData?.clienteId && initialData.clienteId !== '0') {
                        const cli = dataCli.find((c: any) => c.id === initialData.clienteId);
                        if (cli) setSelectedCliente(cli);
                    }
                }
                if (resServ.ok) setServicosDisponiveis(await resServ.json());
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, [initialData]);

    const watchItens = watch('itens');
    const watchDesconto = watch('desconto') || 0;

    const subtotal = watchItens?.reduce((acc, item) => acc + (Number(item.quantidade || 0) * Number(item.precoUnitario || 0)), 0) || 0;
    const totalFinal = Math.max(0, subtotal - watchDesconto);

    const handleClienteChange = (e: any) => {
        const id = e.target.value;
        const cli = clientes.find(c => c.id === id);
        if (cli) {
            setSelectedCliente(cli);
            setValue('clienteNome', cli.nome);
            if (cli.veiculos?.length === 1) {
                const v = cli.veiculos[0];
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
                precoUnitario: Number(servico.preco),
                total: Number(servico.preco)
            });
        }
    };

    const onSubmit = async (formData: OrcamentoFormData) => {
        setIsSubmitting(true);
        try {
            const finalData = {
                ...formData,
                valorTotal: subtotal,
                valorFinal: totalFinal,
                itens: formData.itens.map(it => ({
                    ...it,
                    total: Number(it.quantidade) * Number(it.precoUnitario)
                }))
            };
            await onSave(finalData);
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-effect rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col shadow-2xl">
                {/* Header Dinâmico */}
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-white/10 p-6 flex-shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
                            <p className="text-xs text-slate-400">ID: {initialData?.id || 'Novo'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Cliente e Veículo */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4 shadow-inner">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-white font-semibold flex items-center gap-2"><User className="w-4 h-4 text-orange-400" /> Cliente</h3>
                                    {!isEdit && (
                                        <button type="button" onClick={() => { setIsClienteCadastrado(!isClienteCadastrado); setValue('clienteId', isClienteCadastrado ? '0' : ''); }} className="text-xs text-orange-400 underline">
                                            {isClienteCadastrado ? 'Cliente não cadastrado?' : 'Buscar cadastrado'}
                                        </button>
                                    )}
                                </div>
                                {isClienteCadastrado ? (
                                    <select {...register('clienteId')} onChange={handleClienteChange} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none">
                                        <option value="">Selecione um cliente...</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                ) : (
                                    <input {...register('clienteNome')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Nome do cliente completo" />
                                )}
                                <div className="relative">
                                    <Car className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                    <input {...register('veiculo')} className="w-full p-3 pl-10 bg-slate-900 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Veículo (Modelo - Placa)" />
                                </div>
                            </div>

                            {/* Serviços */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-inner">
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-orange-400" /> Serviços</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                    {servicosDisponiveis.map(s => {
                                        const isSelected = fields.some(f => f.servicoId === s.id);
                                        return (
                                            <button key={s.id} type="button" onClick={() => handleToggleService(s)}
                                                className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                                                <div><p className="text-white text-sm font-medium">{s.nome}</p><p className="text-xs text-slate-400">R$ {Number(s.preco).toFixed(2)}</p></div>
                                                {isSelected && <CheckCircle className="w-4 h-4 text-orange-500" />}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-center bg-white/5 p-3 rounded-xl border border-white/5 transition-colors hover:border-white/10">
                                            <p className="flex-1 text-white text-sm font-medium truncate">{field.nome}</p>
                                            <div className="flex items-center gap-1">
                                                <input type="number" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} className="w-14 p-1 bg-slate-800 rounded-lg text-center text-white text-sm border border-white/10" min="1" />
                                                <input type="number" {...register(`itens.${index}.precoUnitario`, { valueAsNumber: true })} step="0.01" className="w-24 p-1 bg-slate-800 rounded-lg text-right text-white text-sm border border-white/10" />
                                                <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-white font-semibold mb-3">Observações</h3>
                                <textarea {...register('observacoes')} rows={3} className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none" placeholder="Detalhes adicionais para o cliente..." />
                            </div>
                        </div>

                        {/* Coluna de Fechamento */}
                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4 shadow-inner">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Validade</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                        <input type="date" {...register('dataValidade')} className="w-full p-3 pl-10 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
                                    <select {...register('status')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500">
                                        <option value="pendente">Pendente</option>
                                        <option value="aprovado">Aprovado</option>
                                        <option value="rejeitado">Rejeitado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
                                <h3 className="text-white font-bold text-lg mb-2">Resumo Financeiro</h3>
                                <div className="flex justify-between text-slate-400 text-sm"><span>Subtotal</span><span className="font-mono text-white">R$ {subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center text-slate-400 text-sm"><span>Desconto</span><input type="number" {...register('desconto', { valueAsNumber: true })} step="0.01" className="w-24 p-2 bg-white/5 border border-white/10 rounded-lg text-right text-white font-mono" /></div>
                                <div className="h-px bg-white/10 my-4" />
                                <div className="flex justify-between text-white font-black text-xl"><span>Total</span><span className="text-green-500 font-mono">R$ {totalFinal.toFixed(2)}</span></div>

                                <button type="submit" disabled={isSubmitting} className="w-full mt-4 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50">
                                    {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                                    {isEdit ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR ORÇAMENTO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
