-- ============================================
-- PASSO 1: CRIAR TODAS AS TABELAS
-- Execute ESTE arquivo primeiro no Supabase SQL Editor
-- ============================================

-- Criar tabela empresas
CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    logo TEXT,
    ativo BOOLEAN DEFAULT true,
    bloqueado BOOLEAN DEFAULT false,
    "motivoBloqueio" TEXT,
    plano TEXT DEFAULT 'basico',
    "planoId" TEXT,
    "valorMensal" DOUBLE PRECISION DEFAULT 0,
    "dataContratacao" TIMESTAMP DEFAULT NOW(),
    "dataExpiracao" TIMESTAMP,
    "proximoVencimento" TIMESTAMP,
    "limiteUsuarios" INTEGER DEFAULT 5,
    "limiteClientes" INTEGER DEFAULT 100,
    "limiteAgendamentos" INTEGER DEFAULT 1000,
    "observacoesInternas" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "mensagemConfirmacaoAgendamento" TEXT
);

-- Criar tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT, -- NULLABLE para permitir superadmin
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    role TEXT DEFAULT 'usuario',
    ativo BOOLEAN DEFAULT true,
    avatar TEXT,
    telefone TEXT,
    bio TEXT,
    "failedLoginAttempts" INTEGER DEFAULT 0,
    "lockoutUntil" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE ("empresaId", email)
);

-- Inserir empresa root
INSERT INTO empresas (id, nome, cnpj, email, ativo, plano, "limiteUsuarios", "limiteClientes", "limiteAgendamentos")
VALUES (
    'superadmin-root',
    'Superadmin Root',
    '00000000000000-root',
    'admin@sistema.com',
    true,
    'root',
    10,
    1000,
    10000
)
ON CONFLICT (cnpj) DO NOTHING;

-- Deletar superadmins antigos (se existir)
DELETE FROM usuarios WHERE email = 'thiago.deassisbm@gmail.com';

-- Inserir superadmin
INSERT INTO usuarios (id, "empresaId", nome, email, senha, role, ativo)
VALUES (
    'superadmin-' || EXTRACT(EPOCH FROM NOW())::bigint,
    'superadmin-root',
    'Super Admin',
    'thiago.deassisbm@gmail.com',
    '$2b$10$iFuZIib542I4BkQCash8/e9/hbrQ/HJrOsZfuCC756XhAtiNAMFDy',
    'superadmin',
    true
);

-- Verificar
SELECT id, nome, email, role, "empresaId", ativo 
FROM usuarios 
WHERE email = 'thiago.deassisbm@gmail.com';
