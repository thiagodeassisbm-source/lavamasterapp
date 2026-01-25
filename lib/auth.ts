import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';

// Definição única da chave para evitar divergências
// Prioriza a variável de ambiente do Vercel/Produção
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-seguro-lava-master-2026';

export interface AuthContext {
    userId: string;
    empresaId: string | null;
    role: string;
}

export async function getAuthContext(): Promise<AuthContext | null> {
    try {
        const cookieStore = cookies();
        const headersList = headers();

        let token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;

        if (!token) {
            const authHeader = headersList.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            console.log('[AUTH] Nenhum token encontrado.');
            return null;
        }

        // Tenta decodificar o token
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // LOG DE DIAGNÓSTICO PARA O DESENVOLVEDOR (Remover após correção)
        console.log('[AUTH DEBUG] Conteúdo do Token:', JSON.stringify(decoded));

        // Prioridade de campos: sub (padrão JWT) ou id (padrão local)
        const userId = decoded.id || decoded.sub;

        if (!userId) {
            console.error('[AUTH ERROR] Token decodificado mas userId está AUSENTE.');
            return null;
        }

        return {
            userId: userId,
            empresaId: decoded.empresaId ?? null,
            role: decoded.role || 'usuario'
        };
    } catch (error) {
        console.error('[AUTH] Erro na validação:', error instanceof Error ? error.message : error);
        return null;
    }
}

export function verifyAdmin(ctx: AuthContext) {
    return ctx.role === 'admin' || ctx.role === 'gerente' || ctx.role === 'superadmin';
}
