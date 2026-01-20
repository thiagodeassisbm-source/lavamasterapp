
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clients = await prisma.cliente.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { empresa: true }
    });

    console.log("=== ÚLTIMOS CLIENTES ===");
    clients.forEach(c => {
        console.log(`Nome: ${c.nome}, Tel: ${c.telefone}, Empresa: ${c.empresa?.nome} (${c.empresaId})`);
    });

    const empresas = await prisma.empresa.findMany();
    console.log("\n=== EMPRESAS ===");
    empresas.forEach(e => {
        console.log(`ID: ${e.id}, Nome: ${e.nome}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
