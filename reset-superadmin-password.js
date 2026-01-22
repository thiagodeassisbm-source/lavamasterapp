const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function listSuperAdmins() {
    try {
        const superAdmins = await prisma.usuario.findMany({
            where: { role: 'superadmin' }
        });

        console.log('📚 Super Admins cadastrados:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (const admin of superAdmins) {
            console.log(`ID: ${admin.id}`);
            console.log(`Nome: ${admin.nome}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Ativo: ${admin.ativo ? 'Sim' : 'Não'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }

        // Atualizar senha para admin123
        if (superAdmins.length > 0) {
            const senhaHash = await bcrypt.hash('admin123', 10);
            await prisma.usuario.update({
                where: { email_empresaId: { email: superAdmins[0].email, empresaId: superAdmins[0].empresaId } },
                data: { senha: senhaHash }
            });
            console.log('✅ Senha atualizada para: admin123');
        }
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listSuperAdmins();
