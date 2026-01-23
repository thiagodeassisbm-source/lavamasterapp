// forçar a mesma config do lib/prisma.ts
process.env.DATABASE_URL = "postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@db.bkhtemypttswlkluaort.supabase.co:5432/postgres";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('🔍 Varrendo banco de dados...');

    // 1. Check usuarios table
    const usuarios = await prisma.usuario.findMany();
    console.log(`\n📋 Usuários encontrados: ${usuarios.length}`);
    usuarios.forEach(u => console.log(` - ${u.email} (${u.role})`));

    // 2. Tentar achar o usuario misterioso especificamente
    const misterioso = await prisma.usuario.findFirst({
        where: { email: 'teste@lavajato.com' }
    });

    if (misterioso) {
        console.log('\n👻 O USUÁRIO MISTERIOSO EXISTE NO BANCO!');
        console.log(misterioso);
    } else {
        console.log('\n❌ O usuário teste@lavajato.com NÃO existe neste banco.');
    }
}

check();
