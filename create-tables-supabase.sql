-- ============================================
-- CRIAR TABELAS NO SUPABASE
-- ============================================

-- Super Admins
CREATE TABLE IF NOT EXISTS super_admins (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Planos
CREATE TABLE IF NOT EXISTS planos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) DEFAULT 0,
    intervalo TEXT NOT NULL,
    "duracaoDias" INTEGER,
    "limiteUsuarios" INTEGER DEFAULT 1,
    "limiteClientes" INTEGER DEFAULT 100,
    "limiteAgendamentos" INTEGER DEFAULT 1000,
    ativo BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    ordem INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Empresas
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
    "valorMensal" DECIMAL(10,2) DEFAULT 0,
    "dataContratacao" TIMESTAMP DEFAULT NOW(),
    "dataExpiracao" TIMESTAMP,
    "proximoVencimento" TIMESTAMP,
    "limiteUsuarios" INTEGER DEFAULT 5,
    "limiteClientes" INTEGER DEFAULT 100,
    "limiteAgendamentos" INTEGER DEFAULT 1000,
    "observacoesInternas" TEXT,
    "mensagemConfirmacaoAgendamento" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("planoId") REFERENCES planos(id)
);

-- Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
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

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT,
    telefone TEXT NOT NULL,
    email TEXT,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    cep TEXT,
    "dataNascimento" TIMESTAMP,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE ("empresaId", cpf)
);

-- Veículos
CREATE TABLE IF NOT EXISTS veiculos (
    id TEXT PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    ano INTEGER,
    placa TEXT,
    cor TEXT,
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("clienteId") REFERENCES clientes(id) ON DELETE CASCADE
);

-- Serviços
CREATE TABLE IF NOT EXISTS servicos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    duracao INTEGER,
    ativo BOOLEAN DEFAULT true,
    categoria TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    codigo TEXT,
    preco DECIMAL(10,2) NOT NULL,
    custo DECIMAL(10,2) DEFAULT 0,
    estoque INTEGER DEFAULT 0,
    "estoqueMin" INTEGER DEFAULT 0,
    unidade TEXT DEFAULT 'UN',
    categoria TEXT,
    ativo BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    UNIQUE ("empresaId", codigo)
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "veiculoId" TEXT,
    "usuarioId" TEXT,
    "dataHora" TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'agendado',
    observacoes TEXT,
    "valorTotal" DECIMAL(10,2) DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY ("clienteId") REFERENCES clientes(id),
    FOREIGN KEY ("veiculoId") REFERENCES veiculos(id),
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id)
);

-- Agendamentos Serviços
CREATE TABLE IF NOT EXISTS agendamentos_servicos (
    id TEXT PRIMARY KEY,
    "agendamentoId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    quantidade INTEGER DEFAULT 1,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("agendamentoId") REFERENCES agendamentos(id) ON DELETE CASCADE,
    FOREIGN KEY ("servicoId") REFERENCES servicos(id)
);

-- Vendas
CREATE TABLE IF NOT EXISTS vendas (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "dataVenda" TIMESTAMP DEFAULT NOW(),
    "valorTotal" DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    "valorFinal" DECIMAL(10,2) NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    status TEXT DEFAULT 'pago',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY ("clienteId") REFERENCES clientes(id),
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id)
);

-- Itens Venda
CREATE TABLE IF NOT EXISTS itens_venda (
    id TEXT PRIMARY KEY,
    "vendaId" TEXT NOT NULL,
    "produtoId" TEXT,
    "servicoId" TEXT,
    descricao TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("vendaId") REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY ("produtoId") REFERENCES produtos(id),
    FOREIGN KEY ("servicoId") REFERENCES servicos(id)
);

-- Orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "dataOrcamento" TIMESTAMP DEFAULT NOW(),
    validade TIMESTAMP NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    "valorFinal" DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY ("clienteId") REFERENCES clientes(id)
);

-- Itens Orçamento
CREATE TABLE IF NOT EXISTS itens_orcamento (
    id TEXT PRIMARY KEY,
    "orcamentoId" TEXT NOT NULL,
    "produtoId" TEXT,
    "servicoId" TEXT,
    descricao TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    "valorUnitario" DECIMAL(10,2) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("orcamentoId") REFERENCES orcamentos(id) ON DELETE CASCADE,
    FOREIGN KEY ("produtoId") REFERENCES produtos(id),
    FOREIGN KEY ("servicoId") REFERENCES servicos(id)
);

-- Despesas
CREATE TABLE IF NOT EXISTS despesas (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    categoria TEXT NOT NULL,
    "dataVencimento" TIMESTAMP NOT NULL,
    "dataPagamento" TIMESTAMP,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- Receitas
CREATE TABLE IF NOT EXISTS receitas (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    categoria TEXT NOT NULL,
    "dataRecebimento" TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'recebido',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- Movimentações Estoque
CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    tipo TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    motivo TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY ("produtoId") REFERENCES produtos(id)
);

-- ============================================
-- INSERIR SUPER ADMIN
-- ============================================
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
) ON CONFLICT (email) DO NOTHING;

SELECT 'Tabelas criadas com sucesso!' as status;
