const bcrypt = require('bcryptjs')
const fs = require('fs')

async function createSql() {
    const hash = await bcrypt.hash('admin123', 10)

    const sql = `
-- ==========================================
-- CORREÇÃO DE LOGIN SUPER ADMIN NO SUPABASE
-- ==========================================

-- 1. Remover usuário existente para evitar conflitos
DELETE FROM super_admins WHERE email = 'thiago.deassisbm@gmail.com';

-- 2. Inserir usuário novamente com HASH CORRETO
-- Senha: admin123
INSERT INTO super_admins (id, nome, email, senha, ativo, "createdAt", "updatedAt")
VALUES (
    'superadmin-corrigido',
    'Super Administrador',
    'thiago.deassisbm@gmail.com',
    '${hash}',
    true,
    NOW(),
    NOW()
);

-- 3. Confirmar criação
SELECT id, email, ativo FROM super_admins WHERE email = 'thiago.deassisbm@gmail.com';
`
    fs.writeFileSync('fix-login.sql', sql)
    console.log('Arquivo fix-login.sql criado com sucesso.')
}

createSql()
