'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Package, DollarSign, AlertTriangle, FileText } from 'lucide-react';

const produtoSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    descricao: z.string().optional(),
    preco: z.string().min(1, 'Preço é obrigatório'),
    estoque: z.string().min(1, 'Quantidade em estoque é obrigatória'),
    estoqueMin: z.string().min(1, 'Estoque mínimo é obrigatório'),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
    onClose: () => void;
    onSave: (data: ProdutoFormData) => void;
    initialData?: Partial<ProdutoFormData>;
}

export default function ProdutoForm({ onClose, onSave, initialData }: ProdutoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProdutoFormData>({
        resolver: zodResolver(produtoSchema),
        defaultValues: {
            nome: initialData?.nome || '',
            descricao: initialData?.descricao || '',
            preco: initialData?.preco ? String(initialData.preco) : '',
            estoque: initialData?.estoque ? String(initialData.estoque) : '',
            estoqueMin: initialData?.estoqueMin ? String(initialData.estoqueMin) : '',
        },
    });

    const onSubmit = async (data: ProdutoFormData) => {
        setIsSubmitting(true);
        try {
            await onSave(data);
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-effect rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border-b border-white/10 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {initialData ? 'Editar Produto' : 'Novo Produto'}
                                </h2>
                                <p className="text-slate-400 text-sm">Preencha os dados do produto</p>
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
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-6">
                        {/* Nome do Produto */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nome do Produto *
                            </label>
                            <div className="relative">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    {...register('nome')}
                                    type="text"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                    placeholder="Ex: Cera Automotiva"
                                />
                            </div>
                            {errors.nome && (
                                <p className="text-red-400 text-sm mt-1">{errors.nome.message}</p>
                            )}
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Descrição
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <textarea
                                    {...register('descricao')}
                                    rows={3}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Detalhes do produto..."
                                />
                            </div>
                        </div>

                        {/* Estoque e Preço */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Preço */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Preço (R$) *
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        {...register('preco')}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.preco && (
                                    <p className="text-red-400 text-sm mt-1">{errors.preco.message}</p>
                                )}
                            </div>

                            {/* Quantidade em Estoque */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Estoque Atual *
                                </label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        {...register('estoque')}
                                        type="number"
                                        min="0"
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                {errors.estoque && (
                                    <p className="text-red-400 text-sm mt-1">{errors.estoque.message}</p>
                                )}
                            </div>

                            {/* Estoque Mínimo */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Estoque Mínimo *
                                </label>
                                <div className="relative">
                                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        {...register('estoqueMin')}
                                        type="number"
                                        min="0"
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                {errors.estoqueMin && (
                                    <p className="text-red-400 text-sm mt-1">{errors.estoqueMin.message}</p>
                                )}
                            </div>
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
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salvar Produto
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
