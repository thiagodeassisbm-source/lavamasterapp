'use client';

import React from 'react';

interface LogoLMProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function LogoLM({ className = '', size = 'md' }: LogoLMProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-16 h-16 text-2xl',
        xl: 'w-24 h-24 text-4xl',
    };

    return (
        <div className={`relative ${sizeClasses[size]} ${className} group`}>
            {/* Outer Squircle Container */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-300">
                {/* Decorative Glossy Effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                {/* Letters LM */}
                <span className="relative z-10 font-black tracking-tighter text-white italic">
                    LM
                </span>

                {/* Subtle Shine Animation */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </div>
        </div>
    );
}
