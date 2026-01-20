
const http = require('http');

const payload = {
    object: 'whatsapp_business_account',
    entry: [{
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [{
            value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '123456789', phone_number_id: '912852538582028' },
                contacts: [{ profile: { name: 'Thiago Teste' }, wa_id: '5562982933585' }],
                messages: [{
                    from: '5562982933585',
                    id: 'wamid.HBgLM...',
                    timestamp: '1675000000',
                    text: { body: 'Cadastrar cliente Simulado telefone 11777777777' },
                    type: 'text'
                }]
            },
            field: 'messages'
        }]
    }]
};

const data = JSON.stringify(payload);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/whatsapp',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
