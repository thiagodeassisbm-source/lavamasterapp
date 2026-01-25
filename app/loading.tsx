'use client';

import React from 'react';

export default function Loading() {
    return (
        <>
            <div className="loading-bar" />
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
                <div className="relative flex flex-col items-center gap-4">
                    {/* Logo LM with pulse animation */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 animate-pulse">
                        <span className="text-white text-3xl font-black">LM</span>
                    </div>

                    {/* Modern Spinner */}
                    <div className="flex gap-1.5 mt-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
                    </div>

                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Carregando...</p>
                </div>
            </div>
        </>
    );
}
