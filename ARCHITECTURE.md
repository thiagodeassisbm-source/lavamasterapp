# Arquitetura do Sistema - Estética Automotiva

## 📐 Visão Geral

Este documento descreve a arquitetura do sistema de gestão para estética automotiva, seguindo os princípios de **Clean Architecture**, **SOLID** e **Clean Code**.

## 🏗️ Camadas da Arquitetura

### 1. Domain Layer (Camada de Domínio)
**Localização**: `lib/domain/`

A camada mais interna, contém a lógica de negócio pura, independente de frameworks.

#### Entities (Entidades)
**Localização**: `lib/domain/entities/`

Classes que representam os conceitos centrais do negócio:

```typescript
// Exemplo: Cliente.ts
export class Cliente {
  private props: ClienteProps;
  
  constructor(props: ClienteProps) {
    this.validate(props);
    this.props = props;
  }
  
  private validate(props: ClienteProps): void {
    // Validações de negócio
  }
  
  // Métodos de negócio
  public ativar(): void { }
  public desativar(): void { }
}
```

**Entidades Principais**:
- `Empresa`: Representa uma empresa no sistema multi-tenant
- `Usuario`: Usuários do sistema com controle de permissões
- `Cliente`: Clientes da empresa
- `Agendamento`: Agendamentos de serviços
- `Servico`: Serviços oferecidos
- `Produto`: Produtos do estoque
- `Venda`: Vendas realizadas
- `Orcamento`: Orçamentos criados

**Princípios**:
- ✅ Encapsulamento total (propriedades privadas)
- ✅ Validações no construtor
- ✅ Métodos de negócio bem definidos
- ✅ Imutabilidade quando possível
- ✅ Sem dependências externas

#### Repositories (Repositórios - Interfaces)
**Localização**: `lib/domain/repositories/`

Interfaces que definem contratos para acesso a dados:

```typescript
export interface IClienteRepository {
  findById(id: string, empresaId: string): Promise<Cliente | null>;
  findAll(empresaId: string): Promise<Cliente[]>;
  save(cliente: Cliente): Promise<void>;
  update(cliente: Cliente): Promise<void>;
  delete(id: string, empresaId: string): Promise<void>;
}
```

**Princípios**:
- ✅ Dependency Inversion (SOLID)
- ✅ Contratos bem definidos
- ✅ Isolamento de empresas (multi-tenant)

#### Use Cases (Casos de Uso)
**Localização**: `lib/domain/use-cases/`

Orquestram a lógica de negócio:

```typescript
export class CriarAgendamentoUseCase {
  constructor(
    private agendamentoRepository: IAgendamentoRepository,
    private clienteRepository: IClienteRepository
  ) {}
  
  async execute(data: CriarAgendamentoDTO): Promise<Agendamento> {
    // 1. Validar se cliente existe
    const cliente = await this.clienteRepository.findById(data.clienteId);
    if (!cliente) throw new Error('Cliente não encontrado');
    
    // 2. Criar agendamento
    const agendamento = new Agendamento(data);
    
    // 3. Salvar
    await this.agendamentoRepository.save(agendamento);
    
    return agendamento;
  }
}
```

**Princípios**:
- ✅ Single Responsibility (SOLID)
- ✅ Orquestração de entidades
- ✅ Validações de regras de negócio

---

### 2. Infrastructure Layer (Camada de Infraestrutura)
**Localização**: `lib/infrastructure/`

Implementações concretas de acesso a dados e serviços externos.

#### Database
**Localização**: `lib/infrastructure/database/`

Implementações dos repositórios usando Prisma:

```typescript
export class PrismaClienteRepository implements IClienteRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string, empresaId: string): Promise<Cliente | null> {
    const data = await this.prisma.cliente.findFirst({
      where: { id, empresaId }
    });
    
    if (!data) return null;
    return new Cliente(data);
  }
  
  // ... outros métodos
}
```

**Características**:
- ✅ Implementa interfaces do domínio
- ✅ Isolamento por empresa (multi-tenant)
- ✅ Conversão entre modelos Prisma e entidades

#### Auth
**Localização**: `lib/infrastructure/auth/`

Serviços de autenticação e autorização:

```typescript
export class JWTAuthService {
  generateToken(usuario: Usuario): string {
    return jwt.sign(
      { 
        id: usuario.id, 
        empresaId: usuario.empresaId,
        role: usuario.role 
      },
      process.env.JWT_SECRET!
    );
  }
  
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}
```

---

### 3. Application Layer (Camada de Aplicação)
**Localização**: `lib/application/`

Serviços que coordenam casos de uso e lógica de aplicação.

#### Services
**Localização**: `lib/application/services/`

```typescript
export class AgendamentoService {
  constructor(
    private criarAgendamentoUseCase: CriarAgendamentoUseCase,
    private atualizarAgendamentoUseCase: AtualizarAgendamentoUseCase
  ) {}
  
  async criar(data: CriarAgendamentoDTO): Promise<AgendamentoDTO> {
    const agendamento = await this.criarAgendamentoUseCase.execute(data);
    return this.toDTO(agendamento);
  }
  
  private toDTO(agendamento: Agendamento): AgendamentoDTO {
    return {
      id: agendamento.id,
      clienteId: agendamento.clienteId,
      // ... outros campos
    };
  }
}
```

---

### 4. Presentation Layer (Camada de Apresentação)
**Localização**: `lib/presentation/`

Componentes React e lógica de UI.

#### Components
**Localização**: `lib/presentation/components/`

Componentes React reutilizáveis:

```typescript
export default function Dashboard() {
  const [stats, setStats] = useState<StatCard[]>([]);
  
  useEffect(() => {
    // Buscar dados
  }, []);
  
  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

**Categorias**:
- **Layout**: MobileMenu, Header, Footer
- **Dashboard**: Cards, Gráficos, Resumos
- **Forms**: Formulários de cadastro
- **Tables**: Listagens de dados
- **Modals**: Diálogos e confirmações

#### Hooks
**Localização**: `lib/presentation/hooks/`

Custom hooks para lógica reutilizável:

```typescript
export function useAgendamentos(empresaId: string) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchAgendamentos() {
      const data = await api.get(`/agendamentos?empresaId=${empresaId}`);
      setAgendamentos(data);
      setLoading(false);
    }
    
    fetchAgendamentos();
  }, [empresaId]);
  
  return { agendamentos, loading };
}
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  (Components, Hooks, Pages)                             │
│  - Dashboard.tsx                                         │
│  - MobileMenu.tsx                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  (Services, DTOs)                                       │
│  - AgendamentoService                                   │
│  - ClienteService                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                         │
│  (Entities, Use Cases, Repository Interfaces)           │
│  - CriarAgendamentoUseCase                              │
│  - Agendamento (Entity)                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                     │
│  (Repository Implementations, External Services)        │
│  - PrismaAgendamentoRepository                          │
│  - JWTAuthService                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Multi-Tenant Architecture

### Estratégia de Isolamento

O sistema usa **Row-Level Isolation** (isolamento por linha):

```typescript
// Todas as queries incluem empresaId
const clientes = await prisma.cliente.findMany({
  where: { empresaId: usuario.empresaId }
});
```

### Middleware de Segurança

```typescript
export async function authMiddleware(req: Request) {
  const token = req.headers.get('Authorization');
  const payload = verifyToken(token);
  
  // Injeta empresaId em todas as requisições
  req.empresaId = payload.empresaId;
  req.userId = payload.id;
}
```

### Garantias

- ✅ Nenhuma query sem `empresaId`
- ✅ Validação em nível de aplicação
- ✅ Constraints no banco de dados
- ✅ Índices compostos para performance

---

## 📱 PWA Architecture

### Service Worker

Gerenciado automaticamente pelo `next-pwa`:

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Estratégias de cache
});
```

### Manifest

```json
{
  "name": "Estética Automotiva",
  "short_name": "Estética Auto",
  "display": "standalone",
  "icons": [...]
}
```

### Instalação

Componente `PWAInstallPrompt` detecta e oferece instalação:

```typescript
window.addEventListener('beforeinstallprompt', (e) => {
  // Mostra prompt customizado
});
```

---

## 🎯 Princípios SOLID Aplicados

### Single Responsibility Principle (SRP)
- Cada classe tem uma única responsabilidade
- Use cases fazem apenas uma coisa

### Open/Closed Principle (OCP)
- Entidades abertas para extensão
- Fechadas para modificação

### Liskov Substitution Principle (LSP)
- Implementações de repositórios são intercambiáveis

### Interface Segregation Principle (ISP)
- Interfaces específicas e focadas

### Dependency Inversion Principle (DIP)
- Dependências apontam para abstrações
- Injeção de dependências em use cases

---

## 🧪 Testabilidade

### Unit Tests

```typescript
describe('Agendamento', () => {
  it('deve criar um agendamento válido', () => {
    const agendamento = new Agendamento({
      empresaId: '123',
      clienteId: '456',
      dataHora: new Date('2026-01-20')
    });
    
    expect(agendamento.status).toBe('agendado');
  });
  
  it('não deve permitir data passada', () => {
    expect(() => {
      new Agendamento({
        empresaId: '123',
        clienteId: '456',
        dataHora: new Date('2020-01-01')
      });
    }).toThrow('Não é possível agendar para uma data passada');
  });
});
```

### Integration Tests

```typescript
describe('CriarAgendamentoUseCase', () => {
  it('deve criar agendamento com sucesso', async () => {
    const mockRepo = new InMemoryAgendamentoRepository();
    const useCase = new CriarAgendamentoUseCase(mockRepo);
    
    const result = await useCase.execute({
      empresaId: '123',
      clienteId: '456',
      dataHora: new Date('2026-01-20')
    });
    
    expect(result.id).toBeDefined();
  });
});
```

---

## 📊 Performance

### Database Indexes

```prisma
model Cliente {
  @@index([empresaId])
  @@unique([empresaId, cpf])
}
```

### Caching Strategy

- **Static Assets**: Cache-First
- **API Data**: Network-First
- **Images**: Stale-While-Revalidate

### Code Splitting

Next.js faz automaticamente:
- Route-based splitting
- Dynamic imports quando necessário

---

## 🔒 Segurança

### Autenticação
- JWT tokens com expiração
- Refresh tokens
- Bcrypt para senhas

### Autorização
- Role-based access control (RBAC)
- Verificação de empresaId em todas as operações

### Validação
- Validação em múltiplas camadas:
  1. Frontend (React Hook Form + Zod)
  2. Entidades (validação de negócio)
  3. Backend (validação de API)

---

## 📈 Escalabilidade

### Horizontal Scaling
- Stateless application
- JWT para sessões
- Database connection pooling

### Vertical Scaling
- Índices otimizados
- Queries eficientes
- Lazy loading de dados

---

## 🎨 Design Patterns Utilizados

1. **Repository Pattern**: Abstração de acesso a dados
2. **Factory Pattern**: Criação de entidades
3. **Strategy Pattern**: Diferentes estratégias de cache
4. **Observer Pattern**: React hooks e state management
5. **Dependency Injection**: Injeção em use cases e services

---

## 📚 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
