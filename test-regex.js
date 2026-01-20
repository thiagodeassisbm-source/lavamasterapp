
function interpretIntent(text) {
    let cleanText = text.replace(/[:;,]/g, ' ') // Remove pontuação
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove Acentos
        .replace(/\s+/g, ' ') // Remove espaços duplos
        .trim();

    console.log("Clean Text:", cleanText);

    const lower = cleanText.toLowerCase();
    let intent = 'desconhecido';
    let dados = {};

    // Helper para extrair segmentos entre palavras-chave
    const extractSegment = (source, startKws, endKws) => {
        const lowerSource = source.toLowerCase();
        let startIndex = -1;
        let usedKwLength = 0;

        // Encontra onde começa
        for (const kw of startKws) {
            const idx = lowerSource.indexOf(kw);
            if (idx !== -1) {
                startIndex = idx;
                usedKwLength = kw.length;
                break;
            }
        }
        if (startIndex === -1) return null;

        // Corta do início
        let temp = source.substring(startIndex + usedKwLength);
        let lowerTemp = temp.toLowerCase();

        // Encontra onde termina (menor índice das nextKeywords)
        let minEndIndex = lowerTemp.length;
        for (const kw of endKws) {
            const idx = lowerTemp.indexOf(kw);
            if (idx !== -1 && idx < minEndIndex) {
                minEndIndex = idx;
            }
        }

        return temp.substring(0, minEndIndex).trim();
    };

    if (lower.includes('cadastrar') || lower.includes('novo cliente') || lower.includes('adicionar cliente') || lower.startsWith('para cliente') || lower.includes('dados do cliente')) {
        intent = 'cadastrar_cliente';

        // 1. Telefone (Busca padrão numérico forte primeiro)
        // Aceita: (11) 99999-9999, 11999999999, 99999-9999
        // Original Regex
        const phoneMatch = cleanText.match(/(?:(?:\+|00)?55\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))/);

        console.log("Phone Match Original:", phoneMatch);

        if (phoneMatch) {
            dados.telefone = phoneMatch[0].replace(/\D/g, '');
        }

        // Proposed Regex: Simple sequence of 8 to 13 digits
        const simplePhoneMatch = cleanText.match(/(?:(?: telefone| cel| zap| whatsapp))\s*([\d\-\(\)\s]{8,})/i);
        // Or just search for a long number if the specific one failed?
        const loosePhoneMatch = cleanText.match(/\b\d{8,14}\b/);

        console.log("Loose Phone Match:", loosePhoneMatch);

        // 3. Nome
        dados.nome = extractSegment(cleanText, ['cliente', 'nome', 'chama'], ['telefone', 'fone', 'tel', 'cel', 'veiculo', 'carro', 'placa', 'modelo']);

        // 4. Carro
        dados.carro = extractSegment(cleanText, ['veiculo', 'carro', 'modelo', 'automovel'], ['placa', 'cor', 'ano', 'telefone']);

        // Placa
        const plateMatch = cleanText.match(/[a-zA-Z]{3}[-\s]?[0-9][0-9a-zA-Z][0-9]{2}/);
        if (plateMatch) {
            dados.placa = plateMatch[0].toUpperCase().replace(/[-\s]/g, '');
        }
    }

    return { intent, dados };
}

const input = "Cadastrar o cliente ivan telefone, 629123456. veiculo Ford Fiesta. Branco, placa kbd 0102";
console.log(interpretIntent(input));
