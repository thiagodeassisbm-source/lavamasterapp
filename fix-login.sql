
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
    '$2b$10$I2olgPSDKqQoCN4RUe220eFzWE8eiXVYr1dCR7lh8FwJyprUTLi3G',
    true,
    NOW(),
    NOW()
);

-- 3. Confirmar criação
SELECT id, email, ativo FROM super_admins WHERE email = 'thiago.deassisbm@gmail.com';
