-- ============================================
-- CRIAR TODAS AS TABELAS DO SISTEMA
-- Execute este arquivo no Supabase SQL Editor
-- ============================================

-- Já temos: empresas, usuarios
-- Vamos criar as demais:

-- CLIENTES
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

-- VEÍCULOS
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

-- SERVIÇOS
CREATE TABLE IF NOT EXISTS servicos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DOUBLE PRECISION NOT NULL,
    duracao INTEGER,
    ativo BOOLEAN DEFAULT true,
    categoria TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    codigo TEXT,
    preco DOUBLE PRECISION NOT NULL,
    custo DOUBLE PRECISION DEFAULT 0,
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

-- AGENDAMENTOS
CREATE TABLE IF NOT EXISTS agendamentos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "veiculoId" TEXT,
    "usuarioId" TEXT,
    "dataHora" TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'agendado',
    observacoes TEXT,
    "valorTotal" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY ("clienteId") REFERENCES clientes(id),
    FOREIGN KEY ("veiculoId") REFERENCES veiculos(id),
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id)
);

-- AGENDAMENTOS_SERVIÇOS (tabela de relacionamento)
CREATE TABLE IF NOT EXISTS agendamentos_servicos (
    id TEXT PRIMARY KEY,
    "agendamentoId" TEXT NOT NULL,
    "servicoId" TEXT NOT NULL,
    quantidade INTEGER DEFAULT 1,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("agendamentoId") REFERENCES agendamentos(id) ON DELETE CASCADE,
    FOREIGN KEY ("servicoId") REFERENCES servicos(id)
);

-- VENDAS
CREATE TABLE IF NOT EXISTS vendas (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "dataVenda" TIMESTAMP DEFAULT NOW(),
    "valorTotal" DOUBLE PRECISION NOT NULL,
    desconto DOUBLE PRECISION DEFAULT 0,
    "valorFinal" DOUBLE PRECISION NOT NULL,
    "formaPagamento" TEXT NOT NULL,
    status TEXT DEFAULT 'pago',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY ("clienteId") REFERENCES clientes(id),
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id)
);

-- ITENS_VENDA
CREATE TABLE IF NOT EXISTS itens_venda (
    id TEXT PRIMARY KEY,
    "vendaId" TEXT NOT NULL,
    "produtoId" TEXT,
    "servicoId" TEXT,
    descricao TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("vendaId") REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY ("produtoId") REFERENCES produtos(id),
    FOREIGN KEY ("servicoId") REFERENCES servicos(id)
);

-- ORÇAMENTOS
CREATE TABLE IF NOT EXISTS orcamentos (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "dataOrcamento" TIMESTAMP DEFAULT NOW(),
    validade TIMESTAMP NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    desconto DOUBLE PRECISION DEFAULT 0,
    "valorFinal" DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY ("clienteId") REFERENCES clientes(id)
);

-- ITENS_ORÇAMENTO
CREATE TABLE IF NOT EXISTS itens_orcamento (
    id TEXT PRIMARY KEY,
    "orcamentoId" TEXT NOT NULL,
    "produtoId" TEXT,
    "servicoId" TEXT,
    descricao TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("orcamentoId") REFERENCES orcamentos(id) ON DELETE CASCADE,
    FOREIGN KEY ("produtoId") REFERENCES produtos(id),
    FOREIGN KEY ("servicoId") REFERENCES servicos(id)
);

-- DESPESAS
CREATE TABLE IF NOT EXISTS despesas (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor DOUBLE PRECISION NOT NULL,
    categoria TEXT NOT NULL,
    "dataVencimento" TIMESTAMP NOT NULL,
    "dataPagamento" TIMESTAMP,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- RECEITAS
CREATE TABLE IF NOT EXISTS receitas (
    id TEXT PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor DOUBLE PRECISION NOT NULL,
    categoria TEXT NOT NULL,
    "dataRecebimento" TIMESTAMP NOT NULL,
    status TEXT DEFAULT 'recebido',
    observacoes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
);

-- MOVIMENTAÇÕES_ESTOQUE
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

-- PLANOS
CREATE TABLE IF NOT EXISTS planos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco DOUBLE PRECISION DEFAULT 0,
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

-- Mensagem de sucesso
SELECT 'Todas as tabelas foram criadas com sucesso!' as message;
