const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgres://postgres.bkhtemypttswlkluaort:Z4PKLWQY8J9gF6Kp@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

async function createSuperAdmin() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco de dados com sucesso!');

        const email = 'thiago.deassisbm@gmail.com';
        const senha = 'admin123';

        console.log(`🔐 Gerando hash para a senha: ${senha}`);
        const hash = await bcrypt.hash(senha, 10);
        console.log(`🔑 Hash gerado: ${hash}`);

        // 1. Limpar usuário antigo (se existir)
        console.log('🗑️ Removendo usuário antigo (se existir)...');
        await client.query('DELETE FROM super_admins WHERE email = $1', [email]);

        // 2. Inserir novo usuário
        console.log('👤 Criando novo Super Admin...');
        const query = `
            INSERT INTO super_admins (id, nome, email, senha, ativo, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id, nome, email;
        `;

        const values = [
            `superadmin-${Date.now()}`, // ID único
            'Super Admin Oficial',      // Nome
            email,                      // Email
            hash,                       // Senha (Hash)
            true                        // Ativo
        ];

        const res = await client.query(query, values);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUPER ADMIN CRIADO COM SUCESSO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ID:', res.rows[0].id);
        console.log('Nome:', res.rows[0].nome);
        console.log('Email:', res.rows[0].email);
        console.log('Senha:', senha);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('❌ Erro ao criar Super Admin:', err);
    } finally {
        await client.end();
    }
}

createSuperAdmin();
