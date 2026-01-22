const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Ajuste a connectionString conforme o ambiente
const connectionString = process.env.DATABASE_URL || 'postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function createSuperAdmin() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados com sucesso!');

        const email = process.env.SUPERADMIN_EMAIL || 'thiago.deassisbm@gmail.com';
        const senha = process.env.SUPERADMIN_PASSWORD || 'admin123';
        const rootEmpresaId = process.env.SUPERADMIN_EMPRESA_ID || 'superadmin-root';
        const cnpjRoot = process.env.SUPERADMIN_CNPJ || '00000000000000-root';

        const hash = await bcrypt.hash(senha, 10);

        // 0. Garantir empresa raiz
        await client.query(
            `
            INSERT INTO empresas (id, nome, cnpj, email, ativo, plano, "limiteUsuarios", "limiteClientes", "limiteAgendamentos", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, true, 'root', 10, 1000, 10000, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
            `,
            [rootEmpresaId, 'Superadmin Root', cnpjRoot, email]
        );

        // 1. Remover superadmins antigos
        await client.query('DELETE FROM usuarios WHERE email = $1 AND role = $2', [email, 'superadmin']);

        // 2. Inserir novo superadmin
        const insertQuery = `
            INSERT INTO usuarios (id, "empresaId", nome, email, senha, role, ativo, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, 'superadmin', true, NOW(), NOW())
            RETURNING id, nome, email, "empresaId";
        `;

        const values = [
            `superadmin-${Date.now()}`,
            rootEmpresaId,
            'Super Admin Oficial',
            email,
            hash
        ];

        const res = await client.query(insertQuery, values);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUPER ADMIN CRIADO COM SUCESSO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ID:', res.rows[0].id);
        console.log('EmpresaId:', res.rows[0].empresaId);
        console.log('Nome:', res.rows[0].nome);
        console.log('Email:', res.rows[0].email);
        console.log('Senha:', senha);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('❌ Erro ao criar Super Admin:', err);
    } finally {
        await client.end();
    }
}

createSuperAdmin();
