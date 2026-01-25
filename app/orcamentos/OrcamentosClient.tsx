'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const OrcamentoForm = dynamic(() => import('@/lib/presentation/components/OrcamentoForm'), { ssr: false });
const AgendamentoForm = dynamic(() => import('@/lib/presentation/components/AgendamentoForm'), { ssr: false });

import MobileMenu from '@/lib/presentation/components/MobileMenu';
// import OrcamentoForm from '@/lib/presentation/components/OrcamentoForm'; // Removido import estático
import ConfirmDialog from '@/lib/presentation/components/ConfirmDialog';
import Toast, { ToastType } from '@/lib/presentation/components/Toast';
import { FileText, Plus, Clock, CheckCircle, XCircle, Trash2, UserPlus, DollarSign } from 'lucide-react';

interface OrcamentosClientProps {
    initialOrcamentos: any[];
}

export default function OrcamentosClient({ initialOrcamentos }: OrcamentosClientProps) {
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);
    const [selectedOrcamento, setSelectedOrcamento] = useState<any>(null);
    const [orcamentos, setOrcamentos] = useState<any[]>(initialOrcamentos);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [orcamentoToDelete, setOrcamentoToDelete] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ title: string; message: string; type: ToastType; isOpen: boolean }>({
        title: '', message: '', type: 'success', isOpen: false,
    });

    // Estados para a nova rotina de agendamento automático
    const [showSchedulingPrompt, setShowSchedulingPrompt] = useState(false);
    const [showSchedulingForm, setShowSchedulingForm] = useState(false);
    const [initialSchedulingData, setInitialSchedulingData] = useState<any>(null);

    const getStatusColor = (status: string) => {
        const colors = {
            pendente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            aprovado: 'bg-green-500/10 text-green-400 border-green-500/20',
            rejeitado: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
        return colors[status as keyof typeof colors] || colors.pendente;
    };

    const showToast = (title: string, message: string, type: ToastType) => {
        setToast({ title, message, type, isOpen: true });
    };

    const fetchOrcamentos = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/orcamentos');
            if (response.ok) {
                const data = await response.json();
                setOrcamentos(data);
            }
        } catch (error) {
            console.error('Erro ao buscar orçamentos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (formData: any) => {
        try {
            const url = selectedOrcamento ? `/api/orcamentos/${selectedOrcamento.id}` : '/api/orcamentos';
            const method = selectedOrcamento ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showToast('Sucesso!', 'Orçamento salvo com sucesso.', 'success');
                setShowForm(false);

                // ROTINA: Se aprovado, pergunta se quer agendar após fechar o modal
                const isAprovado = formData.status?.toLowerCase() === 'aprovado';

                if (isAprovado) {
                    const schedulingPayload = {
                        clienteId: formData.clienteId && formData.clienteId !== '0' ? formData.clienteId : undefined,
                        novoClienteNome: formData.clienteId === '0' ? formData.clienteNome : undefined,
                        veiculo: formData.veiculo,
                        servicos: (formData.itens || []).map((it: any) => it.nome || it.descricao),
                        observacoes: `Referente ao Orçamento #${selectedOrcamento?.id || 'Novo'}. ${formData.observacoes || ''}`,
                        dataHora: new Date().toISOString().slice(0, 16) // Formato datetime-local
                    };

                    setTimeout(() => {
                        setInitialSchedulingData(schedulingPayload);
                        setShowSchedulingPrompt(true);
                    }, 500);
                }

                setSelectedOrcamento(null);
                await fetchOrcamentos();
            } else {
                const err = await response.json();
                throw new Error(err.error || 'Erro ao salvar');
            }
        } catch (error: any) {
            showToast('Erro', error.message, 'error');
        }
    };

    const handleSaveScheduling = async (schedulingData: any) => {
        try {
            const res = await fetch('/api/agendamentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedulingData)
            });

            if (res.ok) {
                showToast('Agendado!', 'Atendimento agendado com sucesso.', 'success');
                setShowSchedulingForm(false);
                router.refresh();
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Erro ao agendar');
            }
        } catch (error: any) {
            showToast('Erro', error.message, 'error');
        }
    };

    const handleEdit = (orcamento: any) => {
        // Passa o orçamento completo para o formulário tratar
        setSelectedOrcamento(orcamento);
        setShowForm(true);
    };

    // Formatador de data estável para evitar Hydration Error
    const formatDate = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="flex min-h-screen">
            <MobileMenu />
            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Orçamentos</h1>
                        <p className="text-slate-400">Propostas comerciais</p>
                    </div>
                    <button onClick={() => { setSelectedOrcamento(null); setShowForm(true); }} className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Novo Orçamento
                    </button>
                </div>

                {/* Cards Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-effect p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl"><FileText className="text-blue-400" /></div>
                        <div><p className="text-slate-400 text-sm">Total de Orçamentos</p><p className="text-2xl font-bold text-white">{orcamentos.length}</p></div>
                    </div>
                    <div className="glass-effect p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-xl"><Clock className="text-yellow-400" /></div>
                        <div><p className="text-slate-400 text-sm">Aguardando Resposta</p><p className="text-2xl font-bold text-white">{orcamentos.filter(o => o.status === 'pendente').length}</p></div>
                    </div>
                    <div className="glass-effect p-6 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-xl"><DollarSign className="text-green-400" /></div>
                        <div><p className="text-slate-400 text-sm">Total Aprovado (R$)</p><p className="text-2xl font-bold text-green-400">{orcamentos.filter(o => o.status === 'aprovado').reduce((acc, o) => acc + (Number(o.valorFinal || o.valorTotal || 0)), 0).toFixed(2)}</p></div>
                    </div>
                </div>

                <div className="space-y-4">
                    {orcamentos.map(orcamento => {
                        const clienteNome = typeof orcamento.cliente === 'string' ? orcamento.cliente : orcamento.cliente?.nome || 'Cliente';
                        const valorExibicao = Number(orcamento.valorFinal || orcamento.valorTotal || orcamento.valor || 0);

                        return (
                            <div key={orcamento.id} onClick={() => handleEdit(orcamento)} className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-semibold text-white">{clienteNome}</h3>
                                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(orcamento.status)}`}>{orcamento.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Criado em: {formatDate(orcamento.createdAt || orcamento.data)} • Validade: {formatDate(orcamento.validade)}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <p className="text-2xl font-bold text-green-400">R$ {valorExibicao.toFixed(2)}</p>
                                    <button onClick={(e) => { e.stopPropagation(); setOrcamentoToDelete(orcamento.id); setShowDeleteConfirm(true); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {showForm && <OrcamentoForm onClose={() => setShowForm(false)} onSave={handleSave} initialData={selectedOrcamento} />}

                {/* Popups da Rotina de Aprovação */}
                <ConfirmDialog
                    isOpen={showSchedulingPrompt}
                    title="Orçamento Aprovado!"
                    message="Deseja agendar o atendimento para este orçamento agora?"
                    onConfirm={() => {
                        setShowSchedulingPrompt(false);
                        setShowSchedulingForm(true);
                    }}
                    onCancel={() => setShowSchedulingPrompt(false)}
                    type="success"
                />

                {showSchedulingForm && (
                    <AgendamentoForm
                        onClose={() => setShowSchedulingForm(false)}
                        onSave={handleSaveScheduling}
                        initialData={initialSchedulingData}
                    />
                )}

                <ConfirmDialog isOpen={showDeleteConfirm} title="Excluir Orçamento" message="Tem certeza?" onConfirm={async () => {
                    await fetch(`/api/orcamentos/${orcamentoToDelete}`, { method: 'DELETE' });
                    await fetchOrcamentos();
                    setShowDeleteConfirm(false);
                }} onCancel={() => setShowDeleteConfirm(false)} type="danger" />

                <Toast isOpen={toast.isOpen} title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, isOpen: false })} />
            </main>
        </div>
    );
}
