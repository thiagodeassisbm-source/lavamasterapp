
const http = require('http');

http.get('http://localhost:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const tunnels = JSON.parse(data).tunnels;
            if (tunnels.length > 0) {
                console.log("URL_NGROK: " + tunnels[0].public_url);
            } else {
                console.log("Nenhum túnel encontrado.");
            }
        } catch (e) {
            console.log("Erro ao ler JSON: " + e.message);
        }
    });
}).on("error", (err) => {
    console.log("Erro: " + err.message);
});
