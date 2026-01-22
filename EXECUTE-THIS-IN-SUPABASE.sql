-- ============================================
-- MIGRAÇÃO: Superadmin unificado na tabela usuarios
-- ============================================

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

-- 3. Deletar superadmins antigos
DELETE FROM usuarios WHERE email = 'thiago.deassisbm@gmail.com' AND role = 'superadmin';

-- 4. Criar superadmin NOVO na tabela usuarios
INSERT INTO usuarios (id, "empresaId", nome, email, senha, role, ativo, "createdAt", "updatedAt")
VALUES (
    'superadmin-' || EXTRACT(EPOCH FROM NOW())::bigint,
    'superadmin-root',
    'Super Admin',
    'thiago.deassisbm@gmail.com',
    '$2b$10$iFuZIib542I4BkQCash8/e9/hbrQ/HJrOsZfuCC756XhAtiNAMFDy',
    'superadmin',
    true,
    NOW(),
    NOW()
);

-- 5. Dropar tabela super_admins se existir
DROP TABLE IF EXISTS super_admins CASCADE;

-- 6. Verificar criação
SELECT id, nome, email, role, "empresaId" 
FROM usuarios 
WHERE email = 'thiago.deassisbm@gmail.com';
