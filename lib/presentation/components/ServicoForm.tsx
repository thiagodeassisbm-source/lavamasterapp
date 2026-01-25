'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Wrench, DollarSign, Clock, Tag, FileText, Plus } from 'lucide-react';

const servicoSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    descricao: z.string().optional(),
    preco: z.string().min(1, 'Preço é obrigatório'),
    duracao: z.string().optional(),
    categoria: z.string().optional(),
});

type ServicoFormData = z.infer<typeof servicoSchema>;

interface ServicoFormProps {
    onClose: () => void;
    onSave: (data: ServicoFormData) => void;
    initialData?: Partial<ServicoFormData>;
}

export default function ServicoForm({ onClose, onSave, initialData }: ServicoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ServicoFormData>({
        resolver: zodResolver(servicoSchema),
        defaultValues: initialData || {
            nome: '',
            descricao: '',
            preco: '',
            duracao: '',
            categoria: '',
        },
    });

    const onSubmit = async (data: ServicoFormData) => {
        setIsSubmitting(true);
        try {
            await onSave(data);
            onClose();
        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const categorias = [
        'Lavagem',
        'Polimento',
        'Proteção',
        'Limpeza',
        'Estética',
        'Detalhamento',
        'Vitrificação',
        'Outros',
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-effect rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500/20 to-pink-600/20 border-b border-white/10 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                                <Wrench className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {initialData ? 'Editar Serviço' : 'Novo Serviço'}
                                </h2>
                                <p className="text-slate-400 text-sm">Preencha os dados do serviço</p>
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
                        {/* Nome do Serviço */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nome do Serviço *
                            </label>
                            <div className="relative">
                                <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    {...register('nome')}
                                    type="text"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                    placeholder="Ex: Lavagem Completa"
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
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Descreva o serviço oferecido..."
                                />
                            </div>
                        </div>

                        {/* Preço e Duração */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.preco && (
                                    <p className="text-red-400 text-sm mt-1">{errors.preco.message}</p>
                                )}
                            </div>

                            {/* Duração */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Duração (minutos)
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        {...register('duracao')}
                                        type="number"
                                        min="0"
                                        step="15"
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        placeholder="60"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Categoria */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Categoria
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    {isAddingCategory ? (
                                        <input
                                            {...register('categoria')}
                                            type="text"
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                            placeholder="Digite a nova categoria"
                                            autoFocus
                                        />
                                    ) : (
                                        <select
                                            {...register('categoria')}
                                            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all appearance-none"
                                        >
                                            <option value="" className="bg-slate-900 text-slate-400">Selecione uma categoria</option>
                                            {categorias.map((cat) => (
                                                <option key={cat} value={cat} className="bg-slate-900 text-white">
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                                    className={`p-3 rounded-xl border transition-all flex items-center justify-center ${isAddingCategory
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                        : 'bg-pink-500/10 border-pink-500/20 text-pink-400 hover:bg-pink-500/20'
                                        }`}
                                    title={isAddingCategory ? "Cancelar nova categoria" : "Adicionar nova categoria"}
                                >
                                    {isAddingCategory ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </button>
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
                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/30 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salvar Serviço
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
