
const fs = require('fs');
try {
    // Tenta ler com encoding binário/latin1 para evitar erro de UTF
    const buffer = fs.readFileSync('final_serveo.log');
    const text = buffer.toString('latin1'); // Força leitura bruta

    const regex = /https:\/\/[a-zA-Z0-9-]+\.serveousercontent\.com/;
    const match = text.match(regex);

    if (match) {
        console.log("ACHEI_URL: " + match[0]);
    } else {
        console.log("Ainda lendo...");
    }
} catch (e) { console.log(e); }
