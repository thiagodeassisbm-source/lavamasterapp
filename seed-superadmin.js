const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
    try {
        const email = process.env.SUPERADMIN_EMAIL || 'superadmin@lavamaster.com.br';
        const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
        const rootEmpresaId = process.env.SUPERADMIN_EMPRESA_ID || 'superadmin-root';

        const existingSuperAdmin = await prisma.usuario.findFirst({
            where: { role: 'superadmin', email: { equals: email, mode: 'insensitive' } }
        });

        if (existingSuperAdmin) {
            console.log('✅ Super Admin já existe!');
            console.log('Email:', existingSuperAdmin.email);
            return;
        }

        const senhaHash = await bcrypt.hash(password, 10);

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

        const superAdmin = await prisma.usuario.create({
            data: {
                nome: 'Super Administrador',
                email,
                senha: senhaHash,
                ativo: true,
                role: 'superadmin',
                empresaId: rootEmpresaId
            }
        });

        console.log('✅ Super Admin criado com sucesso!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', superAdmin.email);
        console.log('🔑 Senha:', password);
        console.log('🌐 Acesse: http://localhost:3000/superadmin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
        console.error('❌ Erro ao criar Super Admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
