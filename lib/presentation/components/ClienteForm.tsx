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

const veiculoSchema = z.object({
    marca: z.string().optional().nullable().or(z.literal('')),
    modelo: z.string().optional().nullable().or(z.literal('')),
    cor: z.string().optional().nullable().or(z.literal('')),
    ano: z.string().optional().nullable().or(z.literal('')),
    placa: z.string().optional().nullable().or(z.literal('')),
    id: z.string().optional().nullable(),
}).passthrough(); // Allow unknown fields like createdAt, updatedAt

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
    veiculos: z.array(veiculoSchema).optional(),
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

    // Hooks para gerenciar array de veículos
    const { fields, append, remove } = useFieldArray({
        control,
        name: "veiculos"
    });

    // Form temporário para adicionar novo veículo
    const {
        register: registerVeiculo,
        formState: { errors: errorsVeiculo },
        trigger: triggerVeiculo,
        getValues: getValuesVeiculo,
        setValue: setValueVeiculo,
        reset: resetVeiculo
    } = useForm({
        resolver: zodResolver(veiculoSchema),
        defaultValues: {
            marca: '',
            modelo: '',
            cor: '',
            ano: '',
            placa: ''
        }
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

    const handleAddVeiculo = async () => {
        const isValid = await triggerVeiculo();
        if (isValid) {
            const data = getValuesVeiculo();
            append(data);
            resetVeiculo();
            setIsAddingVeiculo(false);
        }
    };

    // Toast state
    const [toast, setToast] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; title: string; message: string }>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    });

    const handleEditVeiculo = (index: number) => {
        const veiculo = fields[index];
        // Remove from list
        remove(index);
        // Populate form
        setValueVeiculo('marca', veiculo.marca);
        setValueVeiculo('modelo', veiculo.modelo);
        setValueVeiculo('cor', veiculo.cor || '');
        setValueVeiculo('ano', veiculo.ano || '');
        setValueVeiculo('placa', veiculo.placa || '');
        // Show form
        setIsAddingVeiculo(true);
        setActiveTab('veiculos');
    };

    const onSubmit = async (data: ClienteFormData) => {
        setIsSubmitting(true);
        try {
            // DEBUG: Salva os dados no localStorage para captura na página de debug
            if (typeof window !== 'undefined') {
                localStorage.setItem('DEBUG_CLIENTE_PAYLOAD', JSON.stringify(data, null, 2));
            }
            await onSave(data);
            setShowSuccess(true); // Mostra o popup de sucesso
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
                <div className="glass-effect rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl animate-scale-in flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-white/10 p-6 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {initialData ? 'Editar Cliente' : 'Novo Cliente'}
                                    </h2>
                                    <p className="text-slate-400 text-sm">Preencha os dados do cliente</p>
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
                        <div className="flex gap-4 mt-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('dados')}
                                className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'dados'
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Dados Pessoais
                                {activeTab === 'dados' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('veiculos')}
                                className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'veiculos'
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Veículos ({fields.length})
                                {activeTab === 'veiculos' && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Form Content - Scrollable Area */}
                    <form className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                            {activeTab === 'dados' ? (
                                // Conteúdo da Aba Dados Pessoais
                                <div className="space-y-6 animate-slide-up">
                                    {/* ... (Manteve os campos de dados pessoais iguais) ... */}
                                    {/* Dados Básicos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Nome Completo *
                                            </label>
                                            <input
                                                {...register('nome')}
                                                type="text"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="Digite o nome completo"
                                            />
                                            {errors.nome && (
                                                <p className="text-red-400 text-sm mt-1">{errors.nome.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                CPF
                                            </label>
                                            <input
                                                {...register('cpf')}
                                                onChange={(e) => {
                                                    e.target.value = formatCPF(e.target.value);
                                                    register('cpf').onChange(e);
                                                }}
                                                type="text"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Data de Nascimento
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                <input
                                                    {...register('dataNascimento')}
                                                    type="date"
                                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contato */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <Phone className="w-5 h-5 text-green-400" />
                                            Contato
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Telefone *
                                                </label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input
                                                        {...register('telefone')}
                                                        onChange={(e) => {
                                                            e.target.value = formatTelefone(e.target.value);
                                                            register('telefone').onChange(e);
                                                        }}
                                                        type="tel"
                                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        placeholder="(00) 00000-0000"
                                                        maxLength={15}
                                                    />
                                                </div>
                                                {errors.telefone && (
                                                    <p className="text-red-400 text-sm mt-1">{errors.telefone.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Email
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input
                                                        {...register('email')}
                                                        type="email"
                                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        placeholder="email@exemplo.com"
                                                    />
                                                </div>
                                                {errors.email && (
                                                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Endereço */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-purple-400" />
                                            Endereço
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    CEP
                                                </label>
                                                <input
                                                    {...register('cep')}
                                                    onChange={handleCEPChange}
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="00000-000"
                                                    maxLength={9}
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Endereço
                                                </label>
                                                <input
                                                    {...register('endereco')}
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="Rua, número, complemento"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Cidade
                                                </label>
                                                <input
                                                    {...register('cidade')}
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="Nome da cidade"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    Estado
                                                </label>
                                                <select
                                                    {...register('estado')}
                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                                >
                                                    <option value="" className="bg-slate-800 text-white">Selecione</option>
                                                    <option value="AC" className="bg-slate-800 text-white">Acre</option>
                                                    <option value="AL" className="bg-slate-800 text-white">Alagoas</option>
                                                    <option value="AP" className="bg-slate-800 text-white">Amapá</option>
                                                    <option value="AM" className="bg-slate-800 text-white">Amazonas</option>
                                                    <option value="BA" className="bg-slate-800 text-white">Bahia</option>
                                                    <option value="CE" className="bg-slate-800 text-white">Ceará</option>
                                                    <option value="DF" className="bg-slate-800 text-white">Distrito Federal</option>
                                                    <option value="ES" className="bg-slate-800 text-white">Espírito Santo</option>
                                                    <option value="GO" className="bg-slate-800 text-white">Goiás</option>
                                                    <option value="MA" className="bg-slate-800 text-white">Maranhão</option>
                                                    <option value="MT" className="bg-slate-800 text-white">Mato Grosso</option>
                                                    <option value="MS" className="bg-slate-800 text-white">Mato Grosso do Sul</option>
                                                    <option value="MG" className="bg-slate-800 text-white">Minas Gerais</option>
                                                    <option value="PA" className="bg-slate-800 text-white">Pará</option>
                                                    <option value="PB" className="bg-slate-800 text-white">Paraíba</option>
                                                    <option value="PR" className="bg-slate-800 text-white">Paraná</option>
                                                    <option value="PE" className="bg-slate-800 text-white">Pernambuco</option>
                                                    <option value="PI" className="bg-slate-800 text-white">Piauí</option>
                                                    <option value="RJ" className="bg-slate-800 text-white">Rio de Janeiro</option>
                                                    <option value="RN" className="bg-slate-800 text-white">Rio Grande do Norte</option>
                                                    <option value="RS" className="bg-slate-800 text-white">Rio Grande do Sul</option>
                                                    <option value="RO" className="bg-slate-800 text-white">Rondônia</option>
                                                    <option value="RR" className="bg-slate-800 text-white">Roraima</option>
                                                    <option value="SC" className="bg-slate-800 text-white">Santa Catarina</option>
                                                    <option value="SP" className="bg-slate-800 text-white">São Paulo</option>
                                                    <option value="SE" className="bg-slate-800 text-white">Sergipe</option>
                                                    <option value="TO" className="bg-slate-800 text-white">Tocantins</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-orange-400" />
                                            Observações
                                        </h3>
                                        <textarea
                                            {...register('observacoes')}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                            placeholder="Informações adicionais sobre o cliente..."
                                        />
                                    </div>
                                </div>
                            ) : (
                                // Conteúdo da Aba Veículos
                                <div className="space-y-6 animate-slide-up">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                            <Car className="w-5 h-5 text-blue-400" />
                                            Veículos Cadastrados
                                        </h3>
                                        {!isAddingVeiculo && (
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingVeiculo(true)}
                                                className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                                            >
                                                + Adicionar Veículo
                                            </button>
                                        )}
                                    </div>

                                    {/* Lista de Veículos */}
                                    {fields.length > 0 && !isAddingVeiculo && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {fields.map((veiculo, index) => (
                                                <div
                                                    key={veiculo.id}
                                                    onClick={() => handleEditVeiculo(index)}
                                                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-start group cursor-pointer hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex gap-4">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                                            <Car className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white">{veiculo.modelo}</h4>
                                                            <p className="text-sm text-slate-400">{veiculo.marca} • {veiculo.cor}</p>
                                                            <div className="flex gap-2 mt-1">
                                                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">{veiculo.placa}</span>
                                                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">{veiculo.ano}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                remove(index);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Excluir Veículo"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Form de Adicionar Veículo */}
                                    {(isAddingVeiculo || fields.length === 0) && (
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-scale-in">
                                            <h4 className="text-white font-medium mb-4">{fields.length === 0 && !isAddingVeiculo ? 'Adicionar Primeiro Veículo' : 'Dados do Veículo'}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Marca *</label>
                                                    <select
                                                        {...registerVeiculo('marca')}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                                    >
                                                        <option value="" className="bg-slate-800 text-white">Selecione</option>
                                                        {marcas.map((marca) => (
                                                            <option key={marca} value={marca} className="bg-slate-800 text-white">
                                                                {marca}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errorsVeiculo.marca && <p className="text-red-400 text-sm mt-1">{errorsVeiculo.marca.message}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Modelo *</label>
                                                    <input
                                                        {...registerVeiculo('modelo')}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        placeholder="Ex: Cerato"
                                                    />
                                                    {errorsVeiculo.modelo && <p className="text-red-400 text-sm mt-1">{errorsVeiculo.modelo.message}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
                                                    <input
                                                        {...registerVeiculo('cor')}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        placeholder="Ex: Prata"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Ano</label>
                                                    <input
                                                        {...registerVeiculo('ano')}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        placeholder="Ex: 2024"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">Placa</label>
                                                    <input
                                                        {...registerVeiculo('placa')}
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        placeholder="ABC-1234"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3 mt-6 justify-end">
                                                {fields.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsAddingVeiculo(false)}
                                                        className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={handleAddVeiculo}
                                                    className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                                                >
                                                    {fields.length === 0 && !isAddingVeiculo ? 'Adicionar' : 'Salvar Veículo'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-white/10 p-6 bg-white/5 flex-shrink-0">
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit(onSubmit, (errors) => {
                                    console.error('Erros de validação:', errors);
                                    const missingFields = Object.keys(errors).join(', ');
                                    setToast({
                                        isOpen: true,
                                        type: 'warning',
                                        title: 'Campos Obrigatórios',
                                        message: `Por favor, verifique os campos: ${missingFields}`
                                    });
                                })}
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
                                        Salvar Cliente
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
