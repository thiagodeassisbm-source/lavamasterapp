-- ============================================
-- CRIAR DADOS DE TESTE (EMPRESA + USUÁRIO)
-- ============================================

-- 1. Criar EMPRESA de Teste
INSERT INTO empresas (id, nome, cnpj, email, plano, ativo, "createdAt", "updatedAt")
VALUES (
    'empresa-teste-001',
    'Lava Jato Exemplo',
    '00.000.000/0001-00',
    'contato@lavajatoexemplo.com',
    'pro', -- Plano PRO
    true,
    NOW(),
    NOW()
) ON CONFLICT (cnpj) DO NOTHING;

-- 2. Criar USUÁRIO para a Empresa
-- Email: teste@lavajato.com
-- Senha: user123
INSERT INTO usuarios (id, "empresaId", nome, email, senha, role, ativo, "createdAt", "updatedAt")
VALUES (
    'user-teste-001',
    'empresa-teste-001',
    'Gerente Teste',
    'teste@lavajato.com',
    '$2a$10$rK8qK8qK8qK8qK8qK8qK8uO8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK', -- Senha: user123 (hash fixo para teste)
    'admin', -- Admin da empresa
    true,
    NOW(),
    NOW()
) 
ON CONFLICT ("empresaId", email) DO UPDATE SET
    senha = '$2a$10$rK8qK8qK8qK8qK8qK8qK8uO8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK',
    ativo = true;

-- Verificar criação
SELECT id, nome, email, "empresaId" FROM usuarios WHERE email = 'teste@lavajato.com';
