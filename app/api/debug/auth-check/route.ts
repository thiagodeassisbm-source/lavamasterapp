import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Tenta decodificar o token se encontrar
    const authToken = cookieStore.get('auth_token')?.value;
    const oldToken = cookieStore.get('auth-token')?.value;

    let decoded = null;
    let error = null;

    try {
        const tokenToVerify = authToken || oldToken;
        if (tokenToVerify) {
            decoded = jwt.decode(tokenToVerify); // Apenas decode, sem verificar assinatura ainda
        }
    } catch (e: any) {
        error = e.message;
    }

    return NextResponse.json({
        cookies_received: allCookies.map(c => c.name), // Lista nomes dos cookies
        has_auth_token: !!authToken, // Tem o cookie novo?
        has_old_token: !!oldToken,   // Tem o cookie velho?
        token_preview: authToken ? authToken.substring(0, 15) + '...' : 'N/A',
        decoded_payload: decoded,
        env_secret_check: process.env.JWT_SECRET ? 'DEFINED' : 'USING_FALLBACK'
    }, { status: 200 });
}
