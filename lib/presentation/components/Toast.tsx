'use client';

import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    isOpen: boolean;
    type: ToastType;
    title: string;
    message?: string;
    onClose: () => void;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        bgGradient: 'from-green-400 to-emerald-500',
        shadowColor: 'shadow-green-500/30',
        buttonGradient: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    },
    error: {
        icon: XCircle,
        bgGradient: 'from-red-400 to-rose-500',
        shadowColor: 'shadow-red-500/30',
        buttonGradient: 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
    },
    warning: {
        icon: AlertTriangle,
        bgGradient: 'from-yellow-400 to-orange-500',
        shadowColor: 'shadow-orange-500/30',
        buttonGradient: 'from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
    },
};

export default function Toast({ isOpen, type, title, message, onClose }: ToastProps) {
    if (!isOpen) return null;

    const config = toastConfig[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-scale-in text-center relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                {/* Icon */}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>

                {/* Message */}
                {message && <p className="text-slate-400 mb-6">{message}</p>}

                {/* Button */}
                <button
                    onClick={onClose}
                    className={`w-full px-6 py-4 bg-gradient-to-r ${config.buttonGradient} text-white font-bold rounded-xl transition-all shadow-lg ${config.shadowColor} text-lg`}
                >
                    OK
                </button>
            </div>
        </div>
    );
}
