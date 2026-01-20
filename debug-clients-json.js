
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clients = await prisma.cliente.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    console.log(JSON.stringify(clients, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
