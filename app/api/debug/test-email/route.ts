import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
    try {
        const smtpUser = process.env.SMTP_USER || "suporte@lavamaster.com.br";
        const smtpPass = process.env.SMTP_PASSWORD;

        if (!smtpPass) {
            return NextResponse.json({ error: 'SMTP_PASSWORD não definida nas variáveis de ambiente!' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            debug: true, // Show debug output
            logger: true // Log information to console
        });

        // Verify connection config
        await new Promise((resolve, reject) => {
            transporter.verify(function (error, success) {
                if (error) {
                    console.error("Erro na verificação SMTP:", error);
                    reject(error);
                } else {
                    console.log("Servidor SMTP pronto");
                    resolve(success);
                }
            });
        });

        // Send test email
        const info = await transporter.sendMail({
            from: `"Teste LavaMaster" <${smtpUser}>`,
            to: "thiago.deassisbm@gmail.com", // Envia para o email do admin para testar
            subject: "Teste de Configuração SMTP - LavaMaster",
            text: "Se você recebeu este email, a configuração SMTP está funcionando perfeitamente!",
            html: "<b>Se você recebeu este email, a configuração SMTP está funcionando perfeitamente!</b>",
        });

        return NextResponse.json({
            success: true,
            message: 'Email de teste enviado!',
            messageId: info.messageId,
            smtpUser: smtpUser,
            // Don't return password
        });

    } catch (error: any) {
        console.error('Erro no teste de email:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            code: error.code,
            command: error.command
        }, { status: 500 });
    }
}
