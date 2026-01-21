const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Conectando ao Supabase...');
    try {
        const admin = await prisma.superAdmin.upsert({
            where: { email: 'thiago.deassisbm@gmail.com' },
            update: {
                senha: 'admin123' // Resetando a senha caso já exista
            },
            create: {
                nome: 'Thiago De Assis',
                email: 'thiago.deassisbm@gmail.com',
                senha: 'admin123'
            }
        });
        console.log('✅ Usuário Super Admin criado/atualizado com sucesso!');
        console.log('Email: thiago.deassisbm@gmail.com');
        console.log('Senha: admin123');
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
