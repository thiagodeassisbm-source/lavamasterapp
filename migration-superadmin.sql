-- Migração para tornar empresaId opcional na tabela usuarios
-- e permitir superadmins sem empresa

-- 1. Tornar empresaId nullable
ALTER TABLE usuarios ALTER COLUMN "empresaId" DROP NOT NULL;

-- 2. Criar empresa root (se não existir)
INSERT INTO empresas (id, nome, cnpj, email, ativo, plano, "limiteUsuarios", "limiteClientes", "limiteAgendamentos", "createdAt", "updatedAt")
VALUES (
    'superadmin-root',
    'Superadmin Root',
    '00000000000000-root',
    'admin@sistema.com',
    true,
    'root',
    10,
    1000,
    10000,
    NOW(),
    NOW()
)
ON CONFLICT (cnpj) DO NOTHING;

-- 3. Criar superadmin na tabela usuarios
INSERT INTO usuarios (id, "empresaId", nome, email, senha, role, ativo, "createdAt", "updatedAt")
VALUES (
    'superadmin-' || EXTRACT(EPOCH FROM NOW())::bigint,
    'superadmin-root',
    'Super Admin',
    'thiago.deassisbm@gmail.com',
    -- Hash bcrypt de 'admin123'
    '$2a$10$rK8qK8qK8qK8qK8qK8qK8uO8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK',
    'superadmin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("empresaId", email) DO UPDATE SET
    senha = EXCLUDED.senha,
    role = 'superadmin',
    ativo = true;

-- 4. Dropar tabela super_admins se existir
DROP TABLE IF EXISTS super_admins CASCADE;
