'use client';

import React, { useState, useEffect } from 'react';
import { Users, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function UserProfile({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();

    useEffect(() => {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Erro ao ler dados do usuário');
            }
        }
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
    };

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    const iconSize = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 transition-all outline-none active:scale-90`}
            >
                <Users className={iconSize[size]} />
            </button>

            {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-white/5 mb-2">
                        <p className="text-white font-semibold truncate">{user?.nome || 'Usuário'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user?.email || 'email@sistema.com'}</p>
                    </div>

                    <Link
                        href="/perfil"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <UserCircle className="w-4 h-4" />
                        <span className="text-sm">Meu Perfil</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors mt-1"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Sair do Sistema</span>
                    </button>
                </div>
            )}
        </div>
    );
}
