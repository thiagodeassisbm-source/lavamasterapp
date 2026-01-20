
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// URL da sua API local (onde o Next.js está rodando)
const API_URL = 'http://localhost:3000/api/automation/chat';

console.log('🤖 Iniciando Bot do Sistema...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ... (rest of imports)

client.on('qr', (qr) => {
    console.log('📱 QR Code recebido!');
    console.log('👀 Para escanear, abra este arquivo no seu navegador:');
    console.log(`👉 http://localhost:3000/qrcode.png`);

    // Gera o arquivo de imagem
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    QRCode.toFile(path.join(publicDir, 'qrcode.png'), qr, {
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, function (err) {
        if (err) console.error('Erro ao salvar QR code:', err);
        else console.log('✅ QR Code salvo em public/qrcode.png');
    });

    // Mantém o terminal também por garantia
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Tudo pronto! O Robô está conectado e ouvindo mensagens.');
    console.log('💬 Pode enviar comandos para este número agora.');
});

client.on('message_create', async (msg) => {
    // LOG BRUTO - MOSTRA TUDO QUE CHEGA
    console.log('>>> [DEBUG] NOVO EVENTO DETECTADO!');
    console.log('    Body:', msg.body);
    console.log('    Type:', msg.type);
    console.log('    From:', msg.from);
    console.log('    To:', msg.to);

    // Filtro simplificado apenas para não crashar
    if (msg.type !== 'chat') {
        console.log('    [Ignorado] Tipo não é texto');
        return;
    }

    // Ignora mensagens que parecem respostas do bot (começam com emojis usados no sistema)
    if (msg.body.startsWith('✅') || msg.body.startsWith('❌') || msg.body.startsWith('⚠️') || msg.body.startsWith('Desculpe')) {
        console.log('    [Ignorado] Resposta do próprio bot');
        return;
    }

    // Log para debug exaustivo
    console.log(`📩 LOG DETALHADO: MSG RECEBIDA | Tipo: ${msg.type} | De Mim: ${msg.fromMe} | Texto: ${msg.body}`);
    console.log(`📩 Processando para API...`);

    try {
        // Envia para o "Cérebro" (API do Next.js)
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bot-secret': 'segredo_do_bot_123'
            },
            body: JSON.stringify({
                message: msg.body,
                userId: msg.from // Usa o número como ID
            })
        });

        const data = await response.json();

        // Se a API retornou successo ou mensagem de erro tratada
        if (data.message) {
            msg.reply(data.message);
        } else {
            msg.reply('❌ Erro: O sistema não retornou uma resposta válida.');
        }

    } catch (error) {
        console.error('❌ Erro ao conectar com o sistema:', error.message);
        msg.reply('🔌 Erro de conexão com o servidor do sistema. Verifique se o site está rodando.');
    }
});

client.initialize();
