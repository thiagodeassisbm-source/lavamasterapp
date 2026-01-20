
const fs = require('fs');
const path = require('path');

function carregarEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split('\n');
        const env = {};
        for (const line of lines) {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim().replace(/"/g, '');
                env[key] = val;
            }
        }
        return env;
    } catch (e) { return {}; }
}

const env = carregarEnv();
const META_API_URL = 'https://graph.facebook.com/v18.0';

async function enviar(numeroAlvo) {
    console.log(`\n📤 Tentando enviar para: ${numeroAlvo}...`);

    try {
        const response = await fetch(`${META_API_URL}/${env.META_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: numeroAlvo,
                type: "template",
                template: {
                    name: "hello_world",
                    language: { code: "en_US" }
                }
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`✅ SUCESSO para ${numeroAlvo}! Código 200.`);
        } else {
            console.log(`❌ FALHA para ${numeroAlvo}:`, data.error.message);
        }

    } catch (error) {
        console.error('❌ Erro de conexão:', error);
    }
}

async function dispararTudo() {
    // Tenta variações comuns de número brasileiro
    await enviar('5562982933585'); // Com o 9
    await enviar('556282933585');  // Sem o 9 (Algumas APIs usam formato antigo)
}

dispararTudo();
