# 🚗 Sistema de Gestão para Estética Automotiva

Sistema completo e moderno de gestão para empresas de estética automotiva, desenvolvido com **TypeScript**, **React**, **Next.js** e **Prisma ORM**.

## ✨ Características Principais

### 🎯 Funcionalidades
- **Multi-tenant**: Suporte para múltiplas empresas com isolamento total de dados
- **PWA (Progressive Web App)**: Instalável no celular como aplicativo nativo
- **Dashboard Intuitivo**: Visão geral do negócio com estatísticas em tempo real
- **Gestão de Agenda**: Controle completo de agendamentos e serviços
- **Financeiro**: Controle de receitas, despesas e fluxo de caixa
- **Clientes**: Cadastro completo com histórico de serviços
- **Orçamentos**: Criação e gestão de orçamentos
- **Estoque**: Controle de produtos e movimentações
- **Serviços**: Catálogo de serviços oferecidos

### 🎨 Design
- **Glassmorphism**: Interface moderna com efeitos de vidro
- **Dark Mode**: Design escuro premium
- **Responsivo**: Otimizado para desktop, tablet e mobile
- **Animações Suaves**: Micro-interações para melhor UX
- **Gradientes Vibrantes**: Paleta de cores moderna e atraente

### 🏗️ Arquitetura
- **Clean Architecture**: Separação clara de responsabilidades
- **OOP (Programação Orientada a Objetos)**: Código organizado e reutilizável
- **Clean Code**: Código limpo e bem documentado
- **TypeScript**: Tipagem forte para maior segurança

## 🚀 Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL com Prisma ORM
- **Authentication**: JWT + bcrypt
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **PWA**: next-pwa

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <repository-url>
cd estetica-automotiva
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/estetica_automotiva"
JWT_SECRET="seu-secret-jwt"
NEXTAUTH_SECRET="seu-secret-nextauth"
```

4. **Configure o banco de dados**
```bash
# Gerar o Prisma Client
npx prisma generate

# Executar as migrations
npx prisma migrate dev --name init

# (Opcional) Popular com dados de exemplo
npx prisma db seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📱 Instalação como PWA

### No Celular (Android/iOS)

1. Acesse o sistema pelo navegador
2. No menu do navegador, selecione "Adicionar à tela inicial"
3. O ícone do app será criado na tela inicial
4. Abra o app como qualquer outro aplicativo

### No Desktop (Chrome/Edge)

1. Acesse o sistema
2. Clique no ícone de instalação na barra de endereços
3. Confirme a instalação
4. O app será instalado como aplicativo standalone

## 🗂️ Estrutura do Projeto

```
estetica-automotiva/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Página do dashboard
│   ├── agenda/                  # Módulo de agenda
│   ├── clientes/                # Módulo de clientes
│   ├── financeiro/              # Módulo financeiro
│   ├── orcamentos/              # Módulo de orçamentos
│   ├── estoque/                 # Módulo de estoque
│   ├── servicos/                # Módulo de serviços
│   ├── layout.tsx               # Layout principal
│   └── page.tsx                 # Página de login
├── lib/
│   ├── domain/                  # Camada de domínio
│   │   ├── entities/           # Entidades de negócio
│   │   ├── repositories/       # Interfaces de repositórios
│   │   └── use-cases/          # Casos de uso
│   ├── infrastructure/          # Camada de infraestrutura
│   │   ├── database/           # Configuração do banco
│   │   └── auth/               # Autenticação
│   ├── application/             # Camada de aplicação
│   │   └── services/           # Serviços de aplicação
│   └── presentation/            # Camada de apresentação
│       ├── components/         # Componentes React
│       └── hooks/              # Custom hooks
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
├── public/
│   ├── icons/                  # Ícones do PWA
│   └── manifest.json           # Manifest do PWA
└── package.json
```

## 🔐 Multi-tenant

O sistema é **multi-tenant**, permitindo que várias empresas usem a mesma instalação sem misturar dados:

- Cada empresa tem seu próprio ID único
- Todos os dados são filtrados por `empresaId`
- Isolamento completo entre empresas
- Usuários pertencem a uma única empresa

### Exemplo de Uso

```typescript
// Ao fazer login, o usuário recebe seu empresaId
const usuario = await login(email, senha);

// Todas as consultas são filtradas automaticamente
const clientes = await getClientes(usuario.empresaId);
const agendamentos = await getAgendamentos(usuario.empresaId);
```

## 👥 Níveis de Acesso

- **Admin**: Acesso total ao sistema
- **Gerente**: Acesso a todas as funcionalidades exceto gestão de usuários
- **Usuário**: Acesso básico às funcionalidades operacionais

## 🎨 Personalização

### Cores
Edite `app/globals.css` para personalizar as cores:

```css
:root {
  --primary: 217 91% 60%;      /* Azul principal */
  --accent: 188 94% 42%;       /* Ciano de destaque */
  --background: 240 10% 3.9%;  /* Fundo escuro */
}
```

### Logo
Substitua os ícones em `public/icons/` pelos ícones da sua empresa.

## 📊 Banco de Dados

O sistema usa **PostgreSQL** com **Prisma ORM**. O schema inclui:

- Empresas (multi-tenant)
- Usuários
- Clientes
- Veículos
- Agendamentos
- Serviços
- Produtos
- Vendas
- Orçamentos
- Financeiro (Receitas/Despesas)
- Estoque

### Comandos Úteis

```bash
# Visualizar o banco de dados
npx prisma studio

# Criar uma nova migration
npx prisma migrate dev --name nome_da_migration

# Resetar o banco de dados
npx prisma migrate reset
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia o servidor de produção
npm run lint         # Executa o linter
npx prisma studio    # Abre o Prisma Studio
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

### Outras Plataformas

O sistema pode ser hospedado em qualquer plataforma que suporte Node.js:
- Railway
- Render
- DigitalOcean
- AWS
- Google Cloud

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📧 Suporte

Para suporte, entre em contato através do email: suporte@esteticaauto.com

---

Desenvolvido com ❤️ usando TypeScript, React e Next.js
