import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Definição única da chave para evitar divergências
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro-lava-master-2026';

export interface AuthContext {
    userId: string;
    empresaId: string;
    role: string;
}

export async function getAuthContext(): Promise<AuthContext | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Suporte para Super Admin (que pode ter empresaId especial) ou Usuário comum
        if (!decoded || (!decoded.empresaId && decoded.role !== 'superadmin')) return null;

        return {
            userId: decoded.id || decoded.sub,
            empresaId: decoded.empresaId || 'superadmin',
            role: decoded.role || 'usuario'
        };
    } catch (error) {
        console.error('Auth context error:', error);
        return null;
    }
}

export function verifyAdmin(ctx: AuthContext) {
    return ctx.role === 'admin' || ctx.role === 'gerente' || ctx.role === 'superadmin';
}
