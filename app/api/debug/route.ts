
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const start = Date.now();
        // Teste simples: contar usuários
        const userCount = await prisma.usuario.count();
        const duration = Date.now() - start;

        return NextResponse.json({
            status: 'ok',
            message: 'Database connection successful',
            userCount,
            duration: `${duration}ms`,
            env: {
                NODE_ENV: process.env.NODE_ENV,
                // Não expor secrets, apenas verificar se existe
                HAS_DATABASE_URL: !!process.env.DATABASE_URL
            }
        });
    } catch (error) {
        console.error('Debug DB Error:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
