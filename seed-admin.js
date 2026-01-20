
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Seed de Admin...');

    // 1. Criar Empresa
    const empresa = await prisma.empresa.create({
        data: {
            nome: 'Lava Master Estética',
            cnpj: '00000000000191',
            email: 'contato@lavamaster.com.br',
            telefone: '11999999999'
        }
    });

    console.log(`✅ Empresa criada: ${empresa.nome}`);

    // 2. Criar Hash da Senha
    const hashedPassword = await bcrypt.hash('Isajoca!4163998', 10);

    // 3. Criar Usuário Admin
    const usuario = await prisma.usuario.create({
        data: {
            empresaId: empresa.id,
            nome: 'Thiago de Assis',
            email: 'thiago_deassisbm@yahoo.com',
            senha: hashedPassword,
            role: 'admin',
            ativo: true
        }
    });

    console.log(`✅ Usuário criado: ${usuario.email}`);
    console.log('🔑 Senha definida: Isajoca!4163998');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
