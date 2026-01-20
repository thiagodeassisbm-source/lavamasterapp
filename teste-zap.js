
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('--- TESTE DE DIAGNÓSTICO DO WHATSAPP ---');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "test-session" }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
    }
});

client.on('qr', (qr) => {
    console.log('📱 QR CODE ABAIXO (Use o modo compacto):');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ DIAGNÓSTICO: Cliente pronto e conectado!');
});

// Ouve qualquer evento de mensagem (inclusive as suas próprias)
client.on('message_create', async (msg) => {
    console.log('📨 MENSAGEM DETECTADA:');
    console.log(`   - De: ${msg.from}`);
    console.log(`   - Para: ${msg.to}`);
    console.log(`   - Texto: ${msg.body}`);
    console.log(`   - É minha?: ${msg.fromMe}`);

    if (msg.body === '!teste') {
        console.log('📤 Tentando responder...');
        await msg.reply('✅ O sistema está ouvindo! Teste concluído com sucesso.');
    }
});

client.initialize();
