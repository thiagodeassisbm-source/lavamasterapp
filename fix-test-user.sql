-- ============================================
-- RECRIAR USUÁRIO DE TESTE (FORÇADO)
-- ============================================

-- Remover anterior para evitar conflitos
DELETE FROM usuarios WHERE email = 'teste@lavajato.com';

-- Garantir que a empresa existe
INSERT INTO empresas (id, nome, cnpj, email, plano, ativo, "createdAt", "updatedAt")
VALUES (
    'empresa-teste-001',
    'Lava Jato Exemplo',
    '00.000.000/0001-00',
    'contato@lavajatoexemplo.com',
    'pro',
    true,
    NOW(),
    NOW()
) ON CONFLICT (cnpj) DO NOTHING;

-- Criar Usuário
-- Email: teste@lavajato.com
-- Senha: 123456
INSERT INTO usuarios (id, "empresaId", nome, email, senha, role, ativo, "createdAt", "updatedAt")
VALUES (
    'user-teste-001',
    'empresa-teste-001',
    'Gerente Teste',
    'teste@lavajato.com',
    '$2a$10$I2SpPTsbo1QX18HHMwt9FOuYyVGOzojyYQvx1hJjHC04plgNNii3Ce',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Confirmar criação
SELECT id, email, senha FROM usuarios WHERE email = 'teste@lavajato.com';
