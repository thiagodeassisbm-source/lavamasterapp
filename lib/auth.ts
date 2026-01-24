import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Definição única da chave para evitar divergências
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro-lava-master-2026';

export interface AuthContext {
    userId: string;
    empresaId: string | null;
    role: string;
}

export async function getAuthContext(): Promise<AuthContext | null> {
    try {
        const cookieStore = cookies(); // No Next 14, cookies() é síncrono

        // Tenta os dois padrões de nome de cookie para garantir compatibilidade total
        const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

        if (!token) {
            console.log('[AUTH] Nenhum token encontrado nos cookies.');
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!decoded) {
            console.log('[AUTH] Falha ao decodificar token.');
            return null;
        }

        // Se não for superadmin, precisa ter um empresaId vinculado
        if (!decoded.empresaId && decoded.role !== 'superadmin') {
            console.log('[AUTH] Token sem empresaId para usuário comum.');
            return null;
        }

        return {
            userId: decoded.id || decoded.sub,
            empresaId: decoded.empresaId ?? null,
            role: decoded.role || 'usuario'
        };
    } catch (error) {
        console.error('[AUTH] Erro crítico na validação do contexto:', error);
        return null;
    }
}

export function verifyAdmin(ctx: AuthContext) {
    return ctx.role === 'admin' || ctx.role === 'gerente' || ctx.role === 'superadmin';
}
