'use client';

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info' | 'success';
}

const typeConfig = {
    danger: {
        iconBg: 'from-red-400 to-rose-500',
        confirmButton: 'from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/30',
        icon: AlertTriangle
    },
    warning: {
        iconBg: 'from-yellow-400 to-orange-500',
        confirmButton: 'from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-orange-500/30',
        icon: AlertTriangle
    },
    info: {
        iconBg: 'from-blue-400 to-cyan-500',
        confirmButton: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/30',
        icon: Info
    },
    success: {
        iconBg: 'from-green-400 to-emerald-500',
        confirmButton: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/30',
        icon: CheckCircle
    },
};

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    type = 'danger'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const config = typeConfig[type] || typeConfig.danger;
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-scale-in text-center relative">
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                {/* Icon */}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${config.iconBg} flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h2>

                {/* Message */}
                <p className="text-slate-400 mb-8 leading-relaxed">{message}</p>

                {/* Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-lg"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-4 bg-gradient-to-r ${config.confirmButton} text-white font-bold rounded-xl transition-all shadow-lg text-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
