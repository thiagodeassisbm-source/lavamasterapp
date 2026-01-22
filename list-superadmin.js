const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listSuperAdmins() {
    try {
        const superAdmins = await prisma.usuario.findMany({
            where: { role: 'superadmin' }
        });

        console.log('📚 Super Admins no banco:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (const admin of superAdmins) {
            console.log(`\n👤 Nome: ${admin.nome}`);
            console.log(`📧 Email: ${admin.email}`);
            console.log(`🔑 Senha: admin123 (resetada)`);
            console.log(`✅ Ativo: ${admin.ativo ? 'Sim' : 'Não'}`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 Acesse: http://localhost:3000/superadmin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listSuperAdmins();
