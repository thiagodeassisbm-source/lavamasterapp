/**
 * Entidade Empresa - Representa uma empresa no sistema multi-tenant
 * Seguindo princípios de Clean Code e OOP
 */

export interface EmpresaProps {
  id?: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  logo?: string;
  ativo?: boolean;
  plano?: 'basico' | 'premium' | 'enterprise';
  dataExpiracao?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Empresa {
  private props: EmpresaProps;

  constructor(props: EmpresaProps) {
    this.validate(props);
    this.props = {
      ...props,
      ativo: props.ativo ?? true,
      plano: props.plano ?? 'basico',
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  private validate(props: EmpresaProps): void {
    if (!props.nome || props.nome.trim().length === 0) {
      throw new Error('Nome da empresa é obrigatório');
    }

    if (!props.cnpj || !this.isValidCNPJ(props.cnpj)) {
      throw new Error('CNPJ inválido');
    }

    if (!props.email || !this.isValidEmail(props.email)) {
      throw new Error('Email inválido');
    }
  }

  private isValidCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/[^\d]/g, '');
    return cleaned.length === 14;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get cnpj(): string {
    return this.props.cnpj;
  }

  get email(): string {
    return this.props.email;
  }

  get telefone(): string | undefined {
    return this.props.telefone;
  }

  get endereco(): string | undefined {
    return this.props.endereco;
  }

  get cidade(): string | undefined {
    return this.props.cidade;
  }

  get estado(): string | undefined {
    return this.props.estado;
  }

  get cep(): string | undefined {
    return this.props.cep;
  }

  get logo(): string | undefined {
    return this.props.logo;
  }

  get ativo(): boolean {
    return this.props.ativo ?? true;
  }

  get plano(): 'basico' | 'premium' | 'enterprise' {
    return this.props.plano ?? 'basico';
  }

  get dataExpiracao(): Date | undefined {
    return this.props.dataExpiracao;
  }

  // Métodos de negócio
  public ativar(): void {
    this.props.ativo = true;
    this.props.updatedAt = new Date();
  }

  public desativar(): void {
    this.props.ativo = false;
    this.props.updatedAt = new Date();
  }

  public atualizarPlano(plano: 'basico' | 'premium' | 'enterprise', dataExpiracao?: Date): void {
    this.props.plano = plano;
    this.props.dataExpiracao = dataExpiracao;
    this.props.updatedAt = new Date();
  }

  public isPlanoAtivo(): boolean {
    if (!this.props.dataExpiracao) return true;
    return new Date() < this.props.dataExpiracao;
  }

  public toJSON(): EmpresaProps {
    return { ...this.props };
  }
}
