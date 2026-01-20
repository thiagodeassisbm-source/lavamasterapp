
const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
    const tunnel = await localtunnel({ port: 3000 });
    console.log(`URL do Túnel: ${tunnel.url}`);
    fs.writeFileSync('url_tunnel.txt', tunnel.url);

    tunnel.on('close', () => {
        console.log('Túnel fechado');
    });
})();
