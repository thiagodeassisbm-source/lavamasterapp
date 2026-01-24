import { NextResponse } from 'next/server';
import { CommandProcessor } from '@/lib/automation/commandProcessor';
import { getAuthContext } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        // 1. Obter e Validar Token de Autenticação
        const botSecret = request.headers.get('x-bot-secret');
        const ctx = await getAuthContext();

        let userId = '';
        let empresaId = '';

        // Se tiver o segredo do bot, bypassa a autenticação via cookie
        if (botSecret === 'segredo_do_bot_123') {
            userId = 'BOT_SYSTEM';
            // Em caso de bot, podemos precisar passar uma empresa default ou via header extra
        } else {
            // Se não for bot, exige contexto autenticado
            if (!ctx) {
                return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
            }
            userId = ctx.userId;
            empresaId = ctx.empresaId || '';
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
        return NextResponse.json(
            { success: false, message: 'Erro interno no processamento IA.' },
            { status: 500 }
        );
    }
}
