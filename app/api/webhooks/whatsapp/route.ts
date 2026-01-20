
import { NextResponse } from 'next/server';
import { CommandProcessor } from '@/lib/automation/commandProcessor';

// Validação do Token (Meta exige isso para verificar o Webhook)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse(null, { status: 403 });
        }
    }
    return new NextResponse(null, { status: 400 });
}

// Recebimento de Mensagens
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const fs = require('fs');
        fs.appendFileSync('webhook_debug.log', `[${new Date().toISOString()}] RECEIVED: ${JSON.stringify(body)}\n`);

        // Verifica se é um evento do WhatsApp
        if (body.object === 'whatsapp_business_account') {

            // Loop pelas entradas (entries)
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;

                    // Se tiver mensagens
                    if (value.messages && value.messages.length > 0) {
                        const msg = value.messages[0];
                        const from = msg.from; // Número do remetente

                        fs.appendFileSync('webhook_debug.log', `[${new Date().toISOString()}] MSG FROM ${from}: ${JSON.stringify(msg)}\n`);

                        // Processa apenas Texto
                        if (msg.type === 'text') {
                            const text = msg.text.body;
                            console.log(`📩 Webhook recebeu de ${from}: ${text}`);

                            fs.appendFileSync('webhook_debug.log', `[${new Date().toISOString()}] PROCESSING TEXT: ${text}\n`);

                            // Chama o Cérebro para processar e responder
                            await CommandProcessor.processMessage(text, from);
                        }
                    }
                }
            }
            return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
        } else {
            return NextResponse.json(null, { status: 404 });
        }
    } catch (error: any) {
        console.error('Webhook Error:', error);
        try {
            require('fs').appendFileSync('webhook_debug.log', `[${new Date().toISOString()}] ERROR: ${error.message}\n`);
        } catch (e) { }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
