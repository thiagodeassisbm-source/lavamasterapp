'use client';

import { useEffect } from 'react';

export default function DebugScript() {
    useEffect(() => {
        const updateWidth = () => {
            const el = document.getElementById('debug-width');
            if (el) el.innerText = window.innerWidth.toString();
        };
        window.addEventListener('resize', updateWidth);
        updateWidth();
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    return null;
}
