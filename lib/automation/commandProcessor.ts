
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, setHours, format, parse } from "date-fns";
import { WhatsAppService } from "@/lib/infrastructure/whatsapp/metaService";

export type IntentType = 'cadastrar_cliente' | 'agendar_servico' | 'registrar_pagamento' | 'confirmar_agendamento' | 'desconhecido';

export interface CommandResponse {
    intent: IntentType;
    dados: any;
    replyMessage: string;
}

export class CommandProcessor {

    // Entrada principal do Webhook
    // Entrada principal do Webhook
    static async processMessage(text: string, userId: string, platform: 'whatsapp' | 'web' = 'whatsapp', empresaId?: string) {

        // 1. Identificar Intenção e Dados
        const interpreted = await this.interpretIntent(text);

        // 2. Executar Ação no Banco
        let resultMessage = "";

        if (interpreted.intent === 'cadastrar_cliente') {
            resultMessage = await this.executeCreateClient(interpreted.dados, empresaId);
        }
        else if (interpreted.intent === 'agendar_servico') {
            resultMessage = await this.executeSchedule(interpreted.dados, empresaId);
        }
        else if (interpreted.intent === 'confirmar_agendamento') {
            resultMessage = await this.executeConfirmSchedule(interpreted.dados, empresaId);
        }
        else if (interpreted.intent === 'registrar_pagamento') {
            resultMessage = "💰 Funcionalidade de Pagamento em desenvolvimento.";
        }
        else {
            resultMessage = "Desculpe, não entendi. Tente: 'Cadastrar cliente [Nome] telefone [Numero]'";
        }

        // 3. Enviar Resposta via Plataforma
        if (platform === 'whatsapp') {
            await WhatsAppService.sendMessage(userId, resultMessage);
        }

        // Retorna para quem chamou (o frontend Web usa isso)
        return { ...interpreted, reply: resultMessage };
    }

    // --- ANALISADOR "INTELIGENTE" (NLP Local) ---
    private static async interpretIntent(text: string): Promise<CommandResponse> {
        let cleanText = text.replace(/[;,]/g, ' ') // Remove pontuação (exceto : de hora)
            .replace(/:(?!\d)/g, ' ') // Remove : apenas se não for seguido de numero
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove Acentos
            .replace(/\s+/g, ' ') // Remove espaços duplos
            .trim();

        const lower = cleanText.toLowerCase();
        let intent: IntentType = 'desconhecido';
        let dados: any = {};

        // Helper para extrair segmentos entre palavras-chave
        const extractSegment = (source: string, startKws: string[], endKws: string[]) => {
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
                    // Se o fim for um boundary de palavra, melhor
                }
            }

            return temp.substring(0, minEndIndex).trim();
        };

        try {
            // Debug log
            const fs = require('fs');
            const logMsg = `[Date: ${new Date().toISOString()}] Input: ${text}\nIntent: ${intent}\nDados: ${JSON.stringify(dados)}\n\n`;
            fs.appendFileSync('automation_debug.log', logMsg);
        } catch (e) { }

        // Regra 1: Cadastro (detecta 'cadastrar', 'novo', 'adicionar', 'para cliente')
        if (lower.includes('cadastrar') || lower.includes('novo cliente') || lower.includes('adicionar cliente') || lower.startsWith('para cliente') || lower.includes('dados do cliente')) {
            intent = 'cadastrar_cliente';

            // 1. Telefone
            // Tenta varios formatos. O mais generico: busca sequencia de digitos/espaços/traços
            // que resulte em 8 a 13 digitos.
            const phoneMatches = cleanText.match(/(?:\d[\s-]*){8,14}/g);
            if (phoneMatches) {
                for (const match of phoneMatches) {
                    const digits = match.replace(/\D/g, '');
                    // Valida comprimento (8 a 13 digitos - ex: 11999999999 ou 5511999999999)
                    if (digits.length >= 8 && digits.length <= 13) {
                        dados.telefone = digits;
                        break; // Pega o primeiro válido
                    }
                }
            }

            // 2. Placa (Busca padrão Mercosul ou antigo)
            // AAA-9999, AAA 9999, AAA9A99 - Com boundary \b para não pegar palavras como 'telefone' => 'one6291'
            const plateMatch = cleanText.match(/\b[a-zA-Z]{3}[-\s]?[0-9][0-9a-zA-Z][0-9]{2}\b/);
            if (plateMatch) {
                dados.placa = plateMatch[0].toUpperCase().replace(/[-\s]/g, '');
            }

            // 3. Nome
            dados.nome = extractSegment(cleanText, ['cliente', 'nome', 'chama'], ['telefone', 'fone', 'tel', 'cel', 'veiculo', 'carro', 'placa', 'modelo']);

            // 4. Carro
            dados.carro = extractSegment(cleanText, ['veiculo', 'carro', 'modelo', 'automovel'], ['placa', 'cor', 'ano', 'telefone']);

            // Fallbacks se não achou por keywords mas a estrutura é simples
            // Ex: "Cadastrar Joao Silva 1199999999"
            if (!dados.nome && !dados.telefone && !dados.carro) {
                // Tenta inferir
            }
        }
        // Regra 2: Confirmar Agendamento
        else if (lower.includes('confirmar') || lower.includes('confirmo')) {
            intent = 'confirmar_agendamento';
            dados.nome = extractSegment(cleanText, ['cliente', 'agendamento de', 'agendamento da', 'agendamento do', 'para', 'confirmar', 'confirmo'], ['hoje', 'amanha', 'amanhã', 'as', 'às', 'hs', 'h']);
            dados.isHoje = lower.includes('hoje');
        }
        // Regra 3: Agendamento
        else if (lower.includes('agendar') || lower.includes('marcar') || lower.includes('agendamento')) {
            intent = 'agendar_servico';
            dados.nome = extractSegment(cleanText, ['cliente', 'para', 'nome'], ['telefone', 'as', 'às', 'dia', 'data', 'amanhã', 'hoje', 'para', 'em']);

            // 1. Data (DD/MM ou DD/MM/AAAA)
            const dateMatch = cleanText.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
            if (dateMatch) {
                dados.dia = parseInt(dateMatch[1]);
                dados.mes = parseInt(dateMatch[2]);
                dados.ano = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
                dados.temDataExata = true;
            }

            // 2. Hora (HH:MM ou HHh ou HH h)
            const timeMatch = lower.match(/(?:as|às|das)?\s*(\d{1,2})[:h]?(\d{2})?\s*(?:h|horas|hrs)?/);
            // Regex melhorado para pegar 13:30, 13h30, 13h, 13 : 30
            // Mas o regex simples acima pode falhar com muitos grupos opcionais. Vamos tentar um mais específico.

            const hoursRegex = /(\d{1,2})(?::|h)(\d{2})/; // 13:30 ou 13h30
            const simpleHourRegex = /(\d{1,2})\s*(?:h|horas)/; // 13h ou 13 horas

            const exactTime = lower.match(hoursRegex);
            if (exactTime) {
                dados.hora = parseInt(exactTime[1]);
                dados.minutos = parseInt(exactTime[2]);
            } else {
                const simpleTime = lower.match(simpleHourRegex);
                if (simpleTime) {
                    dados.hora = parseInt(simpleTime[1]);
                    dados.minutos = 0;
                } else {
                    dados.hora = 9; // Default
                    dados.minutos = 0;
                }
            }

            dados.isAmanha = lower.includes('amanhã') || lower.includes('amanha');
        }

        try {
            // Debug log
            const fs = require('fs');
            const logMsg = `[Date: ${new Date().toISOString()}] Input: ${text}\nIntent: ${intent}\nDados: ${JSON.stringify(dados)}\n\n`;
            fs.appendFileSync('automation_debug.log', logMsg);
        } catch (e) { }

        return { intent, dados, replyMessage: "" };
    }

    // --- EXECUTORES DE AÇÃO ---

    private static async executeCreateClient(dados: any, empresaId?: string): Promise<string> {
        if (!dados.nome || !dados.telefone) return "⚠️ Faltou nome ou telefone para cadastrar.";

        // Fallback de empresa
        let targetEmpresaId = empresaId;
        if (!targetEmpresaId) {
            const emp = await prisma.empresa.findFirst();
            targetEmpresaId = emp?.id;
        }
        if (!targetEmpresaId) return "❌ Erro: Nenhuma empresa configurada no sistema.";

        try {
            // Cria Cliente
            const cliente = await prisma.cliente.create({
                data: {
                    empresaId: targetEmpresaId,
                    nome: dados.nome,
                    telefone: dados.telefone,
                    observacoes: 'Cadastrado via Chat IA'
                } as any
            });

            let msg = `✅ Cliente *${cliente.nome}* cadastrado!`;

            // Se tiver carro, cadastra o veículo
            if (dados.carro) {
                await prisma.veiculo.create({
                    data: {
                        clienteId: cliente.id,
                        modelo: dados.carro,
                        placa: dados.placa || 'SEM-PLACA',
                        marca: 'Genérica',
                        cor: 'Não informada'
                    }
                });
                msg += `\n🚘 Veículo ${dados.carro} adicionado.`;
            }

            return msg;
        } catch (e) {
            console.error(e);
            return "❌ Erro ao cadastrar. Verifique se o telefone já existe.";
        }
    }

    private static async executeConfirmSchedule(dados: any, empresaId?: string): Promise<string> {
        if (!dados.nome) return "⚠️ Desculpe, confirmar o agendamento de quem?";

        let targetEmpresaId = empresaId;
        if (!targetEmpresaId) {
            const emp = await prisma.empresa.findFirst();
            targetEmpresaId = emp?.id;
        }

        // Find Client
        const cliente = await prisma.cliente.findFirst({
            where: { empresaId: targetEmpresaId, nome: { contains: dados.nome } }
        });

        if (!cliente) return `❌ Cliente *${dados.nome}* não encontrado para confirmação.`;

        // Find Appointment (Agendado)
        // Se isHoje, filtro por data. Se não, pego o próximo agendado.

        let whereClause: any = {
            empresaId: targetEmpresaId,
            clienteId: cliente.id,
            status: 'agendado'
        };

        if (dados.isHoje) {
            const todayStart = startOfDay(new Date());
            const todayEnd = addDays(todayStart, 1);
            whereClause.dataHora = {
                gte: todayStart,
                lt: todayEnd
            };
        } else {
            whereClause.dataHora = {
                gte: new Date() // Only future
            };
        }

        const agendamento = await prisma.agendamento.findFirst({
            where: whereClause,
            orderBy: { dataHora: 'asc' }
        });

        if (!agendamento) return `⚠️ Nenhum agendamento pendente encontrado para *${cliente.nome}* ${dados.isHoje ? 'hoje' : ''}.`;

        // Update
        await prisma.agendamento.update({
            where: { id: agendamento.id },
            data: { status: 'confirmado' }
        });

        return `✅ Agendamento de *${cliente.nome}* para ${format(agendamento.dataHora, 'dd/MM HH:mm')} foi CONFIRMADO!`;
    }

    private static async executeSchedule(dados: any, empresaId?: string): Promise<string> {
        if (!dados.nome) return "⚠️ Preciso do nome do cliente para agendar.";

        let targetEmpresaId = empresaId;
        if (!targetEmpresaId) {
            const emp = await prisma.empresa.findFirst();
            targetEmpresaId = emp?.id;
        }

        let cliente = await prisma.cliente.findFirst({
            where: { empresaId: targetEmpresaId, nome: { contains: dados.nome } }
        });

        if (!cliente) {
            // Auto-create client
            try {
                cliente = await prisma.cliente.create({
                    data: {
                        empresaId: targetEmpresaId!,
                        nome: dados.nome,
                        telefone: dados.telefone || 'Não Informado',
                        observacoes: 'Cliente criado automaticamente via Agendamento Bot'
                    }
                });
            } catch (error) {
                return `⚠️ Erro ao criar cliente *${dados.nome}* automaticamente. Tente cadastrar manualmente.`;
            }
        }

        // Define Data
        let data = new Date();

        if (dados.temDataExata) {
            // Mês em JS é 0-indexado (Janeiro = 0)
            data = new Date(dados.ano, dados.mes - 1, dados.dia);
        } else if (dados.isAmanha) {
            data = addDays(data, 1);
        }

        data = setHours(startOfDay(data), dados.hora || 9);
        data.setMinutes(dados.minutos || 0); // Define os minutos também

        await prisma.agendamento.create({
            data: {
                empresaId: targetEmpresaId!,
                clienteId: cliente.id,
                dataHora: data,
                status: 'agendado',
                observacoes: 'Via WhatsApp API'
            }
        });

        return `🗓️ Agendado para *${cliente.nome}*\n📅 Data: ${format(data, 'dd/MM/yyyy HH:mm')}`;
    }
}
