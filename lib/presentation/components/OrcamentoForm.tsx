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
    const [isMounted, setIsMounted] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

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
        defaultValues: {
            clienteId: '',
            clienteNome: '',
            veiculo: '',
            dataValidade: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            observacoes: '',
            status: 'pendente',
            itens: [],
            desconto: 0,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'itens',
    });

    // 1. Carregar Dados do Servidor
    useEffect(() => {
        setIsMounted(true);
        const fetchData = async () => {
            try {
                const [resCli, resServ] = await Promise.all([
                    fetch('/api/clientes'),
                    fetch('/api/servicos')
                ]);
                if (resCli.ok) setClientes(await resCli.json());
                if (resServ.ok) setServicosDisponiveis(await resServ.json());
                setDataLoaded(true);
            } catch (error) {
                console.error('Erro:', error);
                setDataLoaded(true);
            }
        };
        fetchData();
    }, []);

    // 2. Preenchimento (Reset) - SÓ RODA QUANDO OS CLIENTES CHEGAREM
    useEffect(() => {
        if (isMounted && dataLoaded && initialData) {
            const isManual = !initialData.clienteId || initialData.clienteId === '0';
            setIsClienteCadastrado(!isManual);

            // Tenta extrair o veículo das observações se não estiver explícito
            let veiculoMemo = initialData.veiculo || '';
            if (!veiculoMemo && initialData.observacoes?.includes('Veículo:')) {
                const parts = initialData.observacoes.split('Veículo:');
                if (parts[1]) veiculoMemo = parts[1].split('\n')[0].trim();
            }

            // Se ainda assim não tiver, busca o primeiro veículo do cliente carregado
            if (!veiculoMemo && initialData.clienteId && initialData.clienteId !== '0') {
                const cli = clientes.find(c => c.id === initialData.clienteId);
                if (cli && cli.veiculos && cli.veiculos.length > 0) {
                    veiculoMemo = `${cli.veiculos[0].modelo} - ${cli.veiculos[0].placa}`;
                }
            }

            reset({
                clienteId: initialData.clienteId || (isManual ? '0' : ''),
                clienteNome: initialData.clienteNome || initialData.cliente?.nome || initialData.cliente || '',
                veiculo: veiculoMemo,
                dataValidade: initialData.validade?.split('T')[0] || initialData.dataValidade || '',
                observacoes: initialData.observacoes || '',
                status: initialData.status || 'pendente',
                desconto: Number(initialData.desconto || 0),
                itens: (initialData.itens || []).map((it: any) => ({
                    servicoId: it.servicoId,
                    produtoId: it.produtoId,
                    nome: it.nome || it.descricao || it.servico?.nome || it.produto?.nome || 'Item',
                    quantidade: Number(it.quantidade || 1),
                    precoUnitario: Number(it.precoUnitario || it.valorUnitario || 0),
                    total: Number(it.total || it.valorTotal || 0)
                }))
            });
        }
    }, [isMounted, dataLoaded, initialData, reset]);

    const watchItens = watch('itens');
    const watchDesconto = watch('desconto') || 0;
    const subtotal = watchItens?.reduce((acc, item) => acc + (Number(item.quantidade || 0) * Number(item.precoUnitario || 0)), 0) || 0;
    const totalFinal = Math.max(0, subtotal - watchDesconto);

    const handleClienteChange = (e: any) => {
        const id = e.target.value;
        const cli = clientes.find(c => c.id === id);
        if (cli) {
            setValue('clienteNome', cli.nome);
            if (cli.veiculos && cli.veiculos.length > 0) {
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
            // Garante que o veículo fique registrado nas observações para não perder
            let finalObs = formData.observacoes || '';
            if (formData.veiculo && !finalObs.includes('Veículo:')) {
                finalObs = `Veículo: ${formData.veiculo}\n${finalObs}`;
            }

            const finalData = {
                ...formData,
                observacoes: finalObs,
                valorTotal: subtotal,
                valorFinal: totalFinal,
                itens: formData.itens.map(it => ({
                    ...it,
                    valorUnitario: Number(it.precoUnitario),
                    valorTotal: Number(it.quantidade) * Number(it.precoUnitario)
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

    if (!isMounted) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-effect rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col shadow-2xl">

                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-white/10 p-6 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
                            {isEdit && <p className="text-[10px] text-slate-500 font-mono tracking-tighter">#{initialData.id}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!dataLoaded && isEdit && (
                        <div className="flex items-center justify-center p-8 gap-3 text-white bg-white/5 rounded-2xl animate-pulse">
                            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            Carregando dados do orçamento...
                        </div>
                    )}

                    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${!dataLoaded && isEdit ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div className="lg:col-span-2 space-y-6">

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-white font-semibold flex items-center gap-2"><User className="w-4 h-4 text-orange-400" /> Cliente</h3>
                                    {!isEdit && (
                                        <button type="button" onClick={() => { setIsClienteCadastrado(!isClienteCadastrado); setValue('clienteId', isClienteCadastrado ? '0' : ''); }} className="text-xs text-orange-400 underline underline-offset-4">
                                            {isClienteCadastrado ? 'Não cadastrado?' : 'Voltar para cadastrados'}
                                        </button>
                                    )}
                                </div>

                                {isClienteCadastrado ? (
                                    <select {...register('clienteId')} onChange={handleClienteChange} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all">
                                        <option value="">Selecione um cliente...</option>
                                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                ) : (
                                    <input {...register('clienteNome')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nome do cliente" />
                                )}

                                <div className="relative">
                                    <Car className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                    <input {...register('veiculo')} className="w-full p-3 pl-10 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500" placeholder="Veículo (Modelo - Placa)" />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-orange-400" /> Serviços</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                    {servicosDisponiveis.map(s => {
                                        const isSelected = fields.some(f => f.servicoId === s.id);
                                        return (
                                            <button key={s.id} type="button" onClick={() => handleToggleService(s)}
                                                className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/20'}`}>
                                                <div><p className="text-white text-sm font-medium">{s.nome}</p><p className="text-[10px] text-slate-400">R$ {Number(s.preco).toFixed(2)}</p></div>
                                                {isSelected && <CheckCircle className="w-4 h-4 text-orange-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-center bg-white/5 p-3 rounded-xl mb-2 border border-white/5">
                                        <p className="flex-1 text-white text-sm truncate">{field.nome || 'Serviço'}</p>
                                        <div className="flex items-center gap-1">
                                            <input type="number" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} className="w-14 p-1.5 bg-slate-800 rounded-lg text-center text-white text-xs border border-white/10" min="1" />
                                            <input type="number" {...register(`itens.${index}.precoUnitario`, { valueAsNumber: true })} step="0.01" className="w-24 p-1.5 bg-slate-800 rounded-lg text-right text-white text-xs border border-white/10" />
                                            <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-white font-semibold mb-3">Observações Adicionais</h3>
                                <textarea {...register('observacoes')} rows={3} className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 resize-none transition-all" placeholder="Observações do orçamento..." />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Validade</label><input type="date" {...register('dataValidade')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500" /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label><select {...register('status')} className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-white outline-none"><option value="pendente">Pendente</option><option value="aprovado">Aprovado</option><option value="rejeitado">Rejeitado</option></select></div>
                            </div>

                            <div className="bg-slate-900 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 relative overflow-hidden">
                                <h3 className="text-white font-bold text-lg mb-2">Fechamento</h3>
                                <div className="flex justify-between text-slate-400 text-sm"><span>Subtotal</span><span className="font-mono text-white">R$ {subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between items-center text-slate-400 text-sm"><span>Desconto</span><input type="number" {...register('desconto', { valueAsNumber: true })} step="0.01" className="w-24 p-2 bg-white/5 border border-white/10 rounded-lg text-right text-white" /></div>
                                <div className="border-t border-white/10 pt-4 flex justify-between text-white font-bold text-xl"><span>Total Final</span><span className="text-green-500 font-mono">R$ {totalFinal.toFixed(2)}</span></div>

                                {Object.keys(errors).length > 0 && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mt-4">
                                        <p className="text-red-400 text-xs font-bold mb-2 uppercase tracking-widest">Campos Obrigatórios:</p>
                                        <ul className="space-y-1">
                                            {Object.entries(errors).map(([key, err]: any) => (
                                                <li key={key} className="text-[10px] text-red-300 flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-red-500 rounded-full" />
                                                    {err.message || key}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button type="submit" disabled={isSubmitting || (!dataLoaded && isEdit)} className="w-full mt-4 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                                    {isEdit ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
