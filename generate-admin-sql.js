const bcrypt = require('bcryptjs');

async function generateHash() {
    const senha = 'admin123';
    const hash = await bcrypt.hash(senha, 10);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 HASH BCRYPT PARA SENHA: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(hash);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nSQL para inserir superadmin:');
    console.log(`
INSERT INTO usuarios (id, "empresaId", nome, email, senha, role, ativo, "createdAt", "updatedAt")
VALUES (
    'superadmin-' || EXTRACT(EPOCH FROM NOW())::bigint,
    'superadmin-root',
    'Super Admin',
    'thiago.deassisbm@gmail.com',
    '${hash}',
    'superadmin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("empresaId", email) DO UPDATE SET
    senha = EXCLUDED.senha,
    role = 'superadmin',
    ativo = true;
    `);
}

generateHash();
