
const META_API_URL = 'https://graph.facebook.com/v18.0';

export class WhatsAppService {

    static async sendMessage(to: string, text: string) {
        const token = process.env.META_ACCESS_TOKEN;
        const phoneId = process.env.META_PHONE_ID;

        if (!token || !phoneId) {
            console.error("❌ ERRO: Credenciais da Meta não configuradas no .env");
            return;
        }

        try {
            const response = await fetch(`${META_API_URL}/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'text',
                    text: { body: text }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ Erro ao enviar mensagem WhatsApp:', data);
                return false;
            }

            return true;

        } catch (error) {
            console.error('❌ Erro de conexão com Meta API:', error);
            return false;
        }
    }
}
