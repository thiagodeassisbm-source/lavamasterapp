const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
        }
    }
});

async function check() {
    try {
        const total = await prisma.servico.count();
        const sample = await prisma.servico.findMany({
            take: 10,
            select: {
                id: true,
                nome: true,
                empresaId: true
            }
        });
        const empresas = await prisma.empresa.findMany({
            select: { id: true, nome: true }
        });

        console.log('--- DB CHECK ---');
        console.log('Total Serviços:', total);
        console.log('Dados Serviços:', JSON.stringify(sample, null, 2));
        console.log('Empresas no Sistema:', JSON.stringify(empresas, null, 2));

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
