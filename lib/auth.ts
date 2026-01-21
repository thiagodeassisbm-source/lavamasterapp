import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

        if (!decoded || !decoded.empresaId) return null;

        return {
            userId: decoded.id || decoded.sub,
            empresaId: decoded.empresaId,
            role: decoded.role || 'usuario'
        };
    } catch (error) {
        console.error('Auth context error:', error);
        return null;
    }
}

export function verifyAdmin(ctx: AuthContext) {
    return ctx.role === 'admin' || ctx.role === 'gerente';
}
