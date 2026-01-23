import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || "suporte@lavamaster.com.br",
        pass: process.env.SMTP_PASSWORD,
    },
});

export async function sendPasswordResetEmail(email: string, resetLink: string) {
    try {
        const info = await transporter.sendMail({
            from: '"LavaMaster Suporte" <suporte@lavamaster.com.br>', // sender address
            to: email,
            subject: "Recuperação de Senha - LavaMaster",
            html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">LavaMaster</h1>
            </div>
            
            <h2 style="color: #1f2937;">Olá!</h2>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Se você não solicitou isso, pode ignorar este email com segurança.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Redefinir Minha Senha
                </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Ou copie e cole o link abaixo no seu navegador:<br>
                <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                Este é um email automático, por favor não responda.<br>
                © 2026 LavaMaster. Todos os direitos reservados.
            </p>
        </div>
      `,
        });

        console.log("Email enviado: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Erro ao enviar email:", error);
        // Em desenvolvimento, não vamos falhar o request se o email falhar, para facilitar testes
        // Mas em produção seria ideal tratar
        return false;
    }
}
