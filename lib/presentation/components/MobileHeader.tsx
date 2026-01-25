'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Users, LogOut, UserCircle } from 'lucide-react';
import LogoLM from './LogoLM';
import Link from 'next/link';
import UserProfile from './UserProfile';

export default function MobileHeader() {
    const pathname = usePathname();

    // Don't show on login page
    if (pathname === '/' || pathname === '/login') return null;

    const isDashboard = pathname === '/dashboard';

    return (
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-[60] safe-area-top">
            <div className="flex items-center gap-3">
                {isDashboard && (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white active:scale-95 transition-transform"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
                <LogoLM size="sm" />
                <span className="text-white font-bold text-lg tracking-tight">Lava Master</span>
            </div>

            <UserProfile size="md" />
        </div>
    );
}
