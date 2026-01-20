import { NextResponse } from 'next/server';
import { CommandProcessor } from '@/lib/automation/commandProcessor';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        // 1. Obter e Validar Token de Autenticação
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const botSecret = request.headers.get('x-bot-secret');

        let userId = '';
        let empresaId = '';

        // Se tiver o segredo do bot, bypassa a autenticação via cookie
        if (botSecret === 'segredo_do_bot_123') {
            userId = 'BOT_SYSTEM';
            // Deixa vazio para o processador buscar a primeira empresa
        } else {
            // Se não for bot, exige token
            if (!token) {
                return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
            }

            try {
                const secret = process.env.JWT_SECRET || 'dev-secret-key-123';
                const fallback = 'dev-secret-key-123';

                try {
                    const decoded: any = jwt.verify(token, secret);
                    userId = decoded.sub;
                    empresaId = decoded.empresaId;
                } catch (err1) {
                    // Tenta o fallback caso a chave tenha mudado ou não carregado antes
                    const decoded: any = jwt.verify(token, fallback);
                    userId = decoded.sub;
                    empresaId = decoded.empresaId;
                }
            } catch (e) {
                console.log("JWT Verification failed:", e);
                return NextResponse.json({ error: 'Sessão inválida', details: 'Token expirado ou chave incorreta' }, { status: 401 });
            }
        }

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        // 2. Chamar Processador com Contexto da Empresa
        const result = await CommandProcessor.processMessage(message, userId, 'web', empresaId);

        // Simulando delay de digitação "humano" do bot
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json({
            message: result.reply,
            intent: result.intent,
            dados: result.dados
        });

    } catch (error: any) {
        console.error('Automation Error:', error);
        try {
            const fs = require('fs');
            fs.appendFileSync('automation_error.log', `[${new Date().toISOString()}] ERROR: ${error.message}\nSTACK: ${error.stack}\n`);
        } catch (e) { }
        return NextResponse.json(
            { success: false, message: 'Erro interno no processamento IA.' },
            { status: 500 }
        );
    }
}
