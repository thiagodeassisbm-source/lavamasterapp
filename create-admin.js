const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Conectando ao banco...');
    try {
        const email = process.env.SUPERADMIN_EMAIL || 'thiago.deassisbm@gmail.com';
        const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
        const rootEmpresaId = process.env.SUPERADMIN_EMPRESA_ID || 'superadmin-root';

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.empresa.upsert({
            where: { id: rootEmpresaId },
            update: {},
            create: {
                id: rootEmpresaId,
                nome: 'Superadmin Root',
                cnpj: '00000000000000-root',
                email,
                plano: 'root',
                limiteUsuarios: 10,
                limiteClientes: 1000,
                limiteAgendamentos: 10000,
                ativo: true
            }
        });

        const admin = await prisma.usuario.upsert({
            where: { email_empresaId: { email, empresaId: rootEmpresaId } },
            update: {
                senha: hashedPassword,
                ativo: true,
                role: 'superadmin'
            },
            create: {
                nome: 'Super Admin',
                email,
                senha: hashedPassword,
                ativo: true,
                role: 'superadmin',
                empresaId: rootEmpresaId
            }
        });

        console.log('Super Admin criado/atualizado com sucesso!');
        console.log('Email:', admin.email);
        console.log('Senha:', password);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
