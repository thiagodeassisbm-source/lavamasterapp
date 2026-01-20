'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';
import MobileMenu from '@/lib/presentation/components/MobileMenu';

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    status?: 'sent' | 'delivered' | 'read';
};

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function AutomationSimulator() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Olá! Eu sou a IA da Estética Auto. 🤖\n\nPosso ajudar a automatizar suas tarefas. Tente:\n\n1. "Cadastrar cliente João Silva telefone 11999999999"\n2. "Agendar para amanhã cliente João Silva"\n3. "Adicionar veiculo Fusca placa ABC-1234 cliente João Silva"',
            sender: 'bot',
            timestamp: new Date(),
            status: 'read'
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const shouldStopRef = useRef(false); // Ref para controlar parada manual

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true; // Mantém ouvindo
                recognition.interimResults = true; // Resultados parciais
                recognition.lang = 'pt-BR';

                recognition.onstart = () => setIsListening(true);

                recognition.onend = () => {
                    // Lógica de Reinício Automático (Loop Infinito até parada manual)
                    if (!shouldStopRef.current) {
                        console.log("Reiniciando reconhecimento de voz...");
                        try {
                            recognition.start();
                        } catch (e) {
                            console.log("Erro ao reiniciar:", e);
                            // Se falhar o reinicio, talvez parar? Ou tentar denovo?
                            // Vamos assumir que se falhar, parou.
                            // setIsListening(false);
                        }
                    } else {
                        // Parada manual solicitada
                        setIsListening(false);
                    }
                };

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (finalTranscript) {
                        // Append com espaço se já tiver texto
                        setInput(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript));
                    }
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Se estiver gravando, para ao enviar
        if (isListening && recognitionRef.current) {
            shouldStopRef.current = true;
            recognitionRef.current.stop();
        }

        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date(),
            status: 'sent'
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/automation/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.text }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/'; // Redireciona para login (rota raiz)
                    return;
                }
                throw new Error(data.error || 'Erro desconhecido');
            }

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.message || "Desculpe, não consegui processar.",
                sender: 'bot',
                timestamp: new Date(),
                status: 'read'
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "❌ Erro de conexão com o cérebro da IA.",
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleMic = () => {
        if (!recognitionRef.current) {
            alert('Seu navegador não suporta reconhecimento de voz.');
            return;
        }

        if (isListening) {
            // Parar
            shouldStopRef.current = true;
            recognitionRef.current.stop();
        } else {
            // Iniciar
            shouldStopRef.current = false;
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error("Erro ao iniciar mic:", err);
                // Se já estiver rodando, tenta parar e recomeçar
                recognitionRef.current.stop();
                setTimeout(() => recognitionRef.current.start(), 100);
            }
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            <MobileMenu />

            <main className="flex-1 lg:ml-72 flex flex-col h-full relative">

                {/* Visual Background Decoration */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-500/5 to-transparent blur-3xl opacity-30" />
                </div>

                {/* Header Style WhatsApp */}
                <div className="bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between z-10 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                                <Bot className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">Assistente Inteligente</h1>
                            <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                                ● Online
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400">
                        <Video className="w-5 h-5 hover:text-white cursor-pointer" />
                        <Phone className="w-5 h-5 hover:text-white cursor-pointer" />
                        <MoreVertical className="w-5 h-5 hover:text-white cursor-pointer" />
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50"
                    style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}
                        >
                            <div
                                className={`
                                    max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 shadow-md relative
                                    ${msg.sender === 'user'
                                        ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-tr-none'
                                        : 'bg-slate-800 border border-white/5 text-slate-100 rounded-tl-none'}
                                `}
                            >
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                <div className={`text-[10px] mt-2 flex items-center justify-end gap-1 ${msg.sender === 'user' ? 'text-green-200' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.sender === 'user' && (
                                        <span className="text-white font-bold ml-1">✓✓</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-white/5 shadow-md flex items-center gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-white/10 z-10">
                    <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
                        <button type="button" className="p-3 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                            <Paperclip className="w-5 h-5" />
                        </button>

                        <div className="flex-1 relative">

                            {/* Visual Wave Logic - Absolute Overlay */}
                            {isListening && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-full border border-red-500/50 z-20 backdrop-blur-sm">
                                    <div className="flex items-center gap-1.5 pl-4 pr-12 w-full justify-center">
                                        <div className="flex gap-1 items-end h-6">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1 bg-gradient-to-t from-red-600 to-red-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite]"
                                                    style={{
                                                        height: '100%',
                                                        animationDelay: `${i * 0.1}s`,
                                                        animationDuration: `${0.6 + Math.random() * 0.4}s`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-red-400 text-xs font-bold animate-pulse whitespace-nowrap">Gravando...</span>
                                    </div>
                                </div>
                            )}

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Digite um comando..."
                                className={`w-full bg-slate-950 border ${isListening ? 'border-red-500/30' : 'border-white/10'} rounded-full py-3.5 pl-6 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-medium`}
                            />
                        </div>

                        {input.trim() && !isListening ? (
                            <button
                                type="submit"
                                className="p-3.5 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg shadow-green-500/20 transition-all transform hover:scale-105"
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={toggleMic}
                                className={`p-3.5 rounded-full transition-all z-30 ${isListening ? 'bg-red-500 animate-pulse text-white shadow-lg shadow-red-500/30 ring-2 ring-red-500/50 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                            >
                                {isListening ? (
                                    <div className="w-5 h-5 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-white rounded-sm" /> {/* Stop Icon Look */}
                                    </div>
                                ) : (
                                    <Mic className="w-5 h-5" />
                                )}
                            </button>
                        )}
                    </form>
                    <p className="text-center text-xs text-slate-500 mt-2">
                        {isListening ? "Clique no botão vermelho para parar" : 'Dica: Tente "Cadastrar cliente Ana..."'}
                    </p>
                </div>
            </main>
        </div>
    );
}
