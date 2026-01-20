
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking Appointment Stats...');

        const counts = await prisma.agendamento.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });

        console.log('Counts:', counts);

        const total = await prisma.agendamento.count();
        console.log('Total Appointments:', total);

        const clients = await prisma.cliente.count();
        console.log('Total Clients:', clients);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
