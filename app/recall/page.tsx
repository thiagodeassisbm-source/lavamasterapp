'use client';

import { useState, useEffect } from 'react';
import MobileMenu from '@/lib/presentation/components/MobileMenu';
import {
    History as HistoryIcon,
    Search,
    Calendar,
    MessageCircle,
    Car,
    AlertCircle,
    Clock,
    ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RecallItem {
    id: string;
    nome: string;
    telefone: string;
    veiculo: string;
    ultimaVisita: string;
    servicos: string;
    diasAusente: number;
}

export default function RecallPage() {
    const [items, setItems] = useState<RecallItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [minDays, setMinDays] = useState('30');

    // Dropdown state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const fetchRecall = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/recall');
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            } else {
                toast.error('Erro ao carregar dados de recall.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro de conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecall();
    }, []);

    const handleWhatsApp = (item: RecallItem) => {
        const phone = item.telefone?.replace(/\D/g, '');
        if (!phone || phone.length < 8) {
            toast.error('Telefone inválido.');
            return;
        }

        const msg = `Olá *${item.nome}*! Faz *${item.diasAusente} dias* que não vemos o seu *${item.veiculo}* por aqui. 🚗\n\nQue tal agendar aquele trato no visual? Estamos com horários disponíveis!`;
        const link = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
        window.open(link, '_blank');
    };

    // SEARCH RESULTS (For Dropdown)
    // Matches Search Term, Ignores Days
    const searchResults = items.filter(item => {
        const term = searchTerm.toLowerCase();
        return item.nome.toLowerCase().includes(term) ||
            item.veiculo.toLowerCase().includes(term);
    });

    // DISPLAYED ITEMS (For Grid)
    // Matches Search Term AND (Search Active OR matches Days)
    const displayedItems = searchResults.filter(item => {
        if (searchTerm) return true; // If searching, ignore minDays
        return item.diasAusente >= parseInt(minDays || '0');
    });

    return (
        <div className="flex min-h-screen">
            <MobileMenu />

            <main className="flex-1 lg:ml-72 p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8 animate-slide-down">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <HistoryIcon className="w-8 h-8 text-blue-400" />
                        Recall de Clientes
                    </h1>
                    <p className="text-slate-400">
                        Identifique clientes inativos e traga-os de volta.
                    </p>
                </div>

                {/* Filters */}
                <div className="glass-effect rounded-2xl p-6 mb-8 animate-slide-up relative z-30">
                    <div className="flex flex-col md:flex-row gap-4 items-end">

                        {/* Searchable Select (Combobox) */}
                        <div className="flex-1 w-full relative">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Buscar Cliente ou Veículo
                            </label>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    placeholder="Digite para buscar..."
                                    className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            </div>

                            {/* Dropdown Suggestions */}
                            {isDropdownOpen && (
                                <>
                                    {/* Backdrop transparent */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsDropdownOpen(false)}
                                    />

                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 custom-scrollbar ring-1 ring-white/10">
                                        {searchResults.length === 0 ? (
                                            <div className="p-4 text-slate-500 text-sm text-center">
                                                Nenhum resultado encontrado
                                            </div>
                                        ) : (
                                            searchResults.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setSearchTerm(item.nome);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex justify-between items-center group transition-colors"
                                                >
                                                    <span className="font-medium text-white">{item.nome}</span>
                                                    <span className="text-xs text-slate-400 group-hover:text-blue-300 transition-colors">
                                                        {item.veiculo}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-full md:w-48 relative">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Min. Dias Ausente
                            </label>
                            <select
                                value={minDays}
                                onChange={(e) => setMinDays(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                            >
                                <option value="0" className="bg-slate-900">Todos</option>
                                <option value="15" className="bg-slate-900">Mais de 15 dias</option>
                                <option value="30" className="bg-slate-900">Mais de 30 dias</option>
                                <option value="60" className="bg-slate-900">Mais de 60 dias</option>
                                <option value="90" className="bg-slate-900">Mais de 90 dias</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">
                        <p>Carregando dados...</p>
                    </div>
                ) : displayedItems.length === 0 ? (
                    <div className="glass-effect rounded-2xl p-12 text-center text-slate-400 z-10 relative">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum cliente encontrado com os filtros atuais.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 animate-slide-up z-10 relative" style={{ animationDelay: '0.1s' }}>
                        {displayedItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="glass-effect rounded-2xl p-6 hover:bg-white/10 transition-all flex flex-col md:flex-row items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-6 flex-1">
                                    <div className={`
                                        w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-white
                                        ${item.diasAusente > 60 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            item.diasAusente > 30 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'}
                                    `}>
                                        <span className="text-xl">{item.diasAusente}</span>
                                        <span className="text-[10px] font-normal uppercase opacity-80">Dias</span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-white">{item.nome}</h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Car className="w-4 h-4" />
                                                {item.veiculo}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                Última visita: {new Date(item.ultimaVisita).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 truncate max-w-md">
                                            Último serviço: {item.servicos}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleWhatsApp(item)}
                                    className="w-full md:w-auto px-6 py-3 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-lg shadow-green-500/10 flex items-center justify-center gap-2 font-semibold group"
                                >
                                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Enviar Recall
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
