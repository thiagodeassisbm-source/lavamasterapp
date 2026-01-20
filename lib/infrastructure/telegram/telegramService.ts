
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

export class TelegramService {

    static async sendMessage(chatId: string | number, text: string) {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.error("❌ TELEGRAM_BOT_TOKEN não configurado!");
            return;
        }

        const url = `${TELEGRAM_API_URL}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });

            const json = await response.json();
            if (!json.ok) {
                console.error("Erro Telegram API:", json);
            } else {
                console.log(`📤 Telegram enviado para ${chatId}`);
            }
        } catch (error) {
            console.error("Erro ao enviar Telegram:", error);
        }
    }
}
