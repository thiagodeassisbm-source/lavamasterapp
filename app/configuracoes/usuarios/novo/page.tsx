
'use client';

// Fix for autofill background
const styles = `
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
    -webkit-text-fill-color: white !important;
    transition: background-color 5000s ease-in-out 0s;
}
`;

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User, Mail, Lock, Shield, CheckCircle, UserPlus, RefreshCcw, Trash2, Edit, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import MobileMenu from '@/lib/presentation/components/MobileMenu';

const schema = z.object({
    id: z.string().optional(),
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    senha: z.string().optional(), // Opcional na edição
    role: z.enum(['admin', 'gerente', 'usuario']),
});

type FormData = z.infer<typeof schema>;

export default function GerenciarUsuariosPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [editingUser, setEditingUser] = useState<any | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: 'usuario',
        },
    });

    // Carregar usuários
    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/usuarios');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            toast.error('Erro ao carregar lista de usuários');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Preencher formulário para edição
    const handleEdit = (user: any) => {
        setEditingUser(user);
        setValue('id', user.id);
        setValue('nome', user.nome);
        setValue('email', user.email);
        setValue('role', user.role);
        setValue('senha', ''); // Senha vazia para não alterar
        // Rola para o topo (mobile) ou foca no form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        reset({
            role: 'usuario',
            nome: '',
            email: '',
            senha: ''
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const response = await fetch(`/api/usuarios/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Usuário excluído com sucesso');
                fetchUsers();
            } else {
                toast.error('Erro ao excluir usuário');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir usuário');
        }
    };

    const onErrors = (errors: any) => {
        console.error("Erros de validação do formulário:", errors);
        toast.error("Por favor, verifique os campos destacados.");
    };

    const onSubmit = async (data: FormData) => {
        console.log("Iniciando submissão do formulário...", data);
        setIsSubmitting(true);
        try {
            const url = editingUser ? `/api/usuarios/${editingUser.id}` : '/api/usuarios';
            const method = editingUser ? 'PUT' : 'POST';

            // Remover senha se estiver vazia na edição
            if (editingUser && (!data.senha || data.senha.trim() === '')) {
                delete (data as any).senha;
            } else if (!editingUser && (!data.senha || data.senha.trim() === '')) {
                throw new Error("Senha é obrigatória para novos usuários");
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao salvar usuário');
            }

            // Se editando, apenas notifica e recarrega. Se criando, mostra popup.
            if (editingUser) {
                toast.success('Usuário atualizado com sucesso!');
                handleCancelEdit();
                fetchUsers();
            } else {
                setShowSuccess(true);
                fetchUsers(); // Recarrega lista atrás do modal
            }

        } catch (error) {
            console.error("Erro no onSubmit:", error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Erro ao salvar usuário');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            <style jsx global>{styles}</style>
            {/* Modal de Sucesso (apenas criação) */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-scale-in text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

                        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 animate-bounce-short">
                            <CheckCircle className="w-10 h-10 text-blue-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Usuário Criado!</h2>
                        <p className="text-slate-400 mb-8">
                            O usuário foi cadastrado com sucesso e já pode acessar o sistema.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowSuccess(false);
                                    reset({ role: 'usuario' });
                                }}
                                className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 group"
                            >
                                <UserPlus className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                Cadastrar Outro
                            </button>

                            <button
                                onClick={() => router.push('/configuracoes')}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Voltar para Configurações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MobileMenu />
            <main className="flex-1 lg:ml-72 bg-slate-950">
                <div className="p-6 w-full h-full">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4 w-full">
                            <Link
                                href="/configuracoes"
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Gerenciar Usuários</h1>
                                <p className="text-slate-400">Cadastre e gerencie o acesso ao sistema</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* COLUNA 1: FORMULÁRIO (1/3 da tela em Telas Largas) */}
                        <div className="xl:col-span-1 order-2 xl:order-1 h-fit sticky top-6">
                            <form onSubmit={handleSubmit(onSubmit, onErrors)} className="space-y-6">
                                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            {editingUser ? <Edit className="w-5 h-5 text-yellow-400" /> : <UserPlus className="w-5 h-5 text-blue-400" />}
                                            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                                        </h2>
                                        {editingUser && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="text-xs px-2 py-1 bg-white/5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                            >
                                                Cancelar Edição
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {/* Nome */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Nome Completo</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <input
                                                    {...register('nome')}
                                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                    placeholder="Ex: João da Silva"
                                                />
                                            </div>
                                            {errors.nome && <p className="text-red-400 text-xs">{errors.nome.message}</p>}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <input
                                                    {...register('email')}
                                                    type="email"
                                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                    placeholder="Ex: joao@email.com"
                                                />
                                            </div>
                                            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
                                        </div>

                                        {/* Senha */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">
                                                {editingUser ? 'Nova Senha (opcional)' : 'Senha'}
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <input
                                                    {...register('senha')}
                                                    type="password"
                                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                    placeholder={editingUser ? "Deixe em branco para manter" : "******"}
                                                />
                                            </div>
                                            {errors.senha && <p className="text-red-400 text-xs">{errors.senha.message}</p>}
                                        </div>

                                        {/* Role */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-300">Nível de Acesso</label>
                                            <div className="relative">
                                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                <select
                                                    {...register('role')}
                                                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                                                >
                                                    <option value="usuario">Usuário Comum</option>
                                                    <option value="gerente">Gerente</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Processando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    {editingUser ? 'Atualizar Usuário' : 'Salvar Usuário'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>


                        {/* COLUNA 2: LISTA (2/3 da tela) */}
                        <div className="xl:col-span-2 order-1 xl:order-2">
                            <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-white/10">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <User className="w-5 h-5 text-purple-400" />
                                        Usuários Cadastrados
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5">
                                                <th className="p-4 text-sm font-semibold text-slate-300">Nome</th>
                                                <th className="p-4 text-sm font-semibold text-slate-300">Email</th>
                                                <th className="p-4 text-sm font-semibold text-slate-300">Função</th>
                                                <th className="p-4 text-sm font-semibold text-slate-300">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {isLoadingUsers ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                        Carregando...
                                                    </td>
                                                </tr>
                                            ) : users.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                                        Nenhum usuário cadastrado.
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 text-slate-300 font-medium">
                                                            {user.nome}
                                                        </td>
                                                        <td className="p-4 text-slate-400 text-sm">
                                                            {user.email}
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`
                                                                px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                                                ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                                                    user.role === 'gerente' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                                        'bg-slate-700 text-slate-300 border border-slate-600'}
                                                            `}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(user)}
                                                                    className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                                                    title="Editar"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(user.id)}
                                                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
