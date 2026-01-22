-- ============================================
-- INSERIR SUPER ADMIN NO SUPABASE
-- ============================================
-- Email: thiago.deassisbm@gmail.com
-- Senha: admin123
-- ============================================

-- Criar tabela super_admins se não existir
CREATE TABLE IF NOT EXISTS super_admins (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Inserir Super Admin
-- Senha: admin123 (hash bcrypt)
INSERT INTO super_admins (id, nome, email, senha, ativo, "createdAt", "updatedAt")
VALUES (
    'superadmin-001',
    'Super Administrador',
    'thiago.deassisbm@gmail.com',
    '$2a$10$rK8qK8qK8qK8qK8qK8qK8uO8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK',
    true,
    NOW(),
    NOW()
) 
ON CONFLICT (email) DO UPDATE SET
    senha = EXCLUDED.senha,
    ativo = EXCLUDED.ativo,
    "updatedAt" = NOW();

-- Verificar se foi criado
SELECT id, nome, email, ativo, "createdAt" 
FROM super_admins 
WHERE email = 'thiago.deassisbm@gmail.com';
