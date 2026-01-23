'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, User, Mail, Phone, MapPin, Calendar, FileText, Car, CheckCircle } from 'lucide-react';
import Toast from './Toast';
const formatCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

const formatTelefone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
}

const formatCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
}

const formatDateForInput = (value?: string) => {
    if (!value) return '';

    // Se já estiver no formato AAAA-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    // Se estiver no formato DD/MM/AAAA (comum no Brasil)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [dia, mes, ano] = value.split('/');
        return `${ano}-${mes}-${dia}`;
    }

    // Se for ISO string
    try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        return '';
    }

    return '';
};

const emptyToNull = (val: unknown) => val === '' ? null : val;

const veiculoSchema = z.object({
    marca: z.preprocess(emptyToNull, z.string().nullable().optional()),
    modelo: z.preprocess(emptyToNull, z.string().nullable().optional()),
    cor: z.preprocess(emptyToNull, z.string().nullable().optional()),
    ano: z.preprocess(emptyToNull, z.string().nullable().optional()),
    placa: z.preprocess(emptyToNull, z.string().nullable().optional()),
    id: z.string().optional().nullable(),
}).passthrough();

const clienteSchema = z.object({
    // Dados Pessoais
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    cpf: z.string().optional(),
    telefone: z.string().min(10, 'Telefone inválido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
    dataNascimento: z.string().optional(),
    observacoes: z.string().optional(),

    // Lista de Veículos
    veiculos: z.array(z.any()).optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
    onClose: () => void;
    onSave: (data: ClienteFormData) => void;
    initialData?: Partial<ClienteFormData>;
}

export default function ClienteForm({ onClose, onSave, initialData }: ClienteFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'dados' | 'veiculos'>('dados');
    const [isAddingVeiculo, setIsAddingVeiculo] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        trigger,
        getValues,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ClienteFormData>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            nome: initialData?.nome || '',
            telefone: initialData?.telefone || '',
            email: initialData?.email || '',
            endereco: initialData?.endereco || '',
            cidade: initialData?.cidade || '',
            estado: initialData?.estado || '',
            cep: initialData?.cep || '',
            cpf: initialData?.cpf || '',
            dataNascimento: formatDateForInput(initialData?.dataNascimento),
            observacoes: initialData?.observacoes || '',
            veiculos: initialData?.veiculos ?? [], // Garantir que nunca seja undefined
        },
    });

    const [editingVeiculoIndex, setEditingVeiculoIndex] = useState<number | null>(null);
    const [veiculoForm, setVeiculoForm] = useState({
        marca: '',
        modelo: '',
        cor: '',
        ano: '',
        placa: ''
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "veiculos"
    });

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string }>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });

    const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = formatCEP(e.target.value);
        setValue('cep', value, { shouldValidate: true });

        if (value.length === 9) {
            try {
                const cleanCep = value.replace(/\D/g, '');
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setValue('endereco', data.logradouro);
                    setValue('cidade', data.localidade);
                    setValue('estado', data.uf as any); // Type assertion if needed
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
        }
    };

    const handleSaveVeiculoLocal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('Botão Salvar Veículo clicado!');

        if (!veiculoForm.marca || !veiculoForm.modelo) {
            setToast({
                isOpen: true,
                type: 'warning',
                title: 'Campos Obrigatórios',
                message: 'Marca e Modelo são obrigatórios para o veículo.'
            });
            return;
        }

        if (editingVeiculoIndex !== null) {
            update(editingVeiculoIndex, { ...veiculoForm });
            setEditingVeiculoIndex(null);
        } else {
            append({ ...veiculoForm });
        }

        // Reset form local
        setVeiculoForm({
            marca: '',
            modelo: '',
            cor: '',
            ano: '',
            placa: ''
        });
        setIsAddingVeiculo(false);
    };

    const handleEditVeiculo = (index: number) => {
        const veiculo = fields[index];
        setVeiculoForm({
            marca: veiculo.marca || '',
            modelo: veiculo.modelo || '',
            cor: veiculo.cor || '',
            ano: veiculo.ano || '',
            placa: veiculo.placa || ''
        });

        setEditingVeiculoIndex(index);
        setIsAddingVeiculo(true);
        setActiveTab('veiculos');
    };

    const onSubmit = async (data: ClienteFormData) => {
        setIsSubmitting(true);
        try {
            await onSave(data);
            setShowSuccess(true);
        } catch (error: any) {
            console.error('Erro ao salvar cliente:', error);
            setToast({
                isOpen: true,
                type: 'error',
                title: 'Erro ao Salvar',
                message: error.message || 'Ocorreu um erro ao salvar o cliente.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const marcas = [
        'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai',
        'Jeep', 'Kia', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Peugeot', 'Renault',
        'Toyota', 'Volkswagen', 'Volvo', 'Outra',
    ];

    return (
        <>
            {/* Modal de Sucesso */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-scale-in text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Salvo com Sucesso!</h2>
                        <p className="text-slate-400 mb-6">O cliente foi cadastrado com sucesso no sistema.</p>
                        <button
                            onClick={onClose}
                            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/30 text-lg"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Toast de Erro */}
            <Toast
                isOpen={toast.isOpen}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
            />

            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="glass-effect rounded-3xl w-full max-w-6xl h-[95vh] border border-white/20 shadow-2xl animate-scale-in flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-white/10 p-5 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {initialData ? 'Editar Cliente' : 'Novo Cliente'}
                                    </h2>
                                    <p className="text-slate-400 text-xs">Informações completas do cliente</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 mt-4">
                            <button
                                type="button"
                                onClick={() => setActiveTab('dados')}
                                className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'dados' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Dados Pessoais
                                {activeTab === 'dados' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('veiculos')}
                                className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'veiculos' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                Veículos ({fields.length})
                                {activeTab === 'veiculos' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full" />}
                            </button>
                        </div>
                    </div>

                    {/* Form Content - Scrollable Area */}
                    <form className="flex-1 overflow-y-auto p-5" onSubmit={(e) => e.preventDefault()}>
                        <div className="space-y-4">
                            {activeTab === 'dados' ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome Completo *</label>
                                        <input {...register('nome')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nome do cliente" />
                                        {errors.nome && <p className="text-red-400 text-[10px] mt-1">{errors.nome.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">CPF</label>
                                        <input {...register('cpf')} onChange={(e) => { e.target.value = formatCPF(e.target.value); register('cpf').onChange(e); }} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="000.000.000-00" maxLength={14} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefone *</label>
                                        <input {...register('telefone')} onChange={(e) => { e.target.value = formatTelefone(e.target.value); register('telefone').onChange(e); }} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="(00) 00000-0000" maxLength={15} />
                                        {errors.telefone && <p className="text-red-400 text-[10px] mt-1">{errors.telefone.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
                                        <input {...register('email')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="cliente@email.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">CEP</label>
                                        <input {...register('cep')} onChange={handleCEPChange} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="00000-000" maxLength={9} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Endereço</label>
                                        <input {...register('endereco')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Rua, número, complemento" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Cidade</label>
                                        <input {...register('cidade')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Cidade" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Data de Nascimento</label>
                                        <input {...register('dataNascimento')} type="date" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Observações</label>
                                        <textarea {...register('observacoes')} rows={3} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="Observações adicionais..." />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-slide-up">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Car className="w-4 h-4 text-blue-400" /> Veículos</h3>
                                        {!isAddingVeiculo && (
                                            <button type="button" onClick={() => setIsAddingVeiculo(true)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-all">+ Novo Veículo</button>
                                        )}
                                    </div>

                                    {fields.length > 0 && !isAddingVeiculo && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {fields.map((veiculo: any, index) => (
                                                <div key={veiculo.id} onClick={() => handleEditVeiculo(index)} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center group cursor-pointer hover:bg-white/10 transition-all">
                                                    <div className="flex gap-3 items-center">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Car className="w-4 h-4 text-blue-400" /></div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{veiculo.modelo}</h4>
                                                            <p className="text-[10px] text-slate-400">{veiculo.marca} • {veiculo.placa}</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(index); }} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(isAddingVeiculo || fields.length === 0) && (
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 border-dashed border-blue-500/30">
                                            <h4 className="text-white font-medium text-sm mb-4">{editingVeiculoIndex !== null ? 'Editando Veículo' : 'Dados do Veículo'}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Marca *</label>
                                                    <select
                                                        value={veiculoForm.marca}
                                                        onChange={(e) => setVeiculoForm({ ...veiculoForm, marca: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        <option value="">Selecione</option>
                                                        {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Modelo *</label>
                                                    <input
                                                        type="text"
                                                        value={veiculoForm.modelo}
                                                        onChange={(e) => setVeiculoForm({ ...veiculoForm, modelo: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Ex: HB20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Cor</label>
                                                    <input
                                                        type="text"
                                                        value={veiculoForm.cor}
                                                        onChange={(e) => setVeiculoForm({ ...veiculoForm, cor: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="Ex: Preto"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Ano</label>
                                                    <input
                                                        type="text"
                                                        value={veiculoForm.ano}
                                                        onChange={(e) => setVeiculoForm({ ...veiculoForm, ano: e.target.value })}
                                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="2024"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Placa</label>
                                                    <input
                                                        type="text"
                                                        value={veiculoForm.placa}
                                                        onChange={(e) => setVeiculoForm({ ...veiculoForm, placa: e.target.value.toUpperCase() })}
                                                        className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                        placeholder="ABC1D23"
                                                    />
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <button type="button" onClick={() => { setIsAddingVeiculo(false); setEditingVeiculoIndex(null); }} className="flex-1 px-3 py-2 bg-white/5 text-slate-400 rounded-lg text-xs hover:bg-white/10 transition-all">Cancelar</button>
                                                    <button type="button" onClick={handleSaveVeiculoLocal} className="flex-[2] px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">Salvar Veículo</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Sticky Footer */}
                    <div className="border-t border-white/10 p-5 bg-slate-900/50 flex flex-shrink-0 justify-end gap-3 backdrop-blur-md">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all">Fechar</button>
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleSubmit(onSubmit, (err) => {
                                console.error('Erro de validação:', err);
                                setToast({ isOpen: true, type: 'warning', title: 'Campos Inválidos', message: 'Verifique se nome e telefone estão corretos.' });
                            })}
                            className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                            {initialData ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
