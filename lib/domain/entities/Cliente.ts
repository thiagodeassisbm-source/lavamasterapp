/**
 * Entidade Cliente - Representa um cliente da empresa
 */

export interface ClienteProps {
    id?: string;
    empresaId: string;
    nome: string;
    cpf?: string;
    telefone: string;
    email?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    dataNascimento?: Date;
    observacoes?: string;
    ativo?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Cliente {
    private props: ClienteProps;

    constructor(props: ClienteProps) {
        this.validate(props);
        this.props = {
            ...props,
            ativo: props.ativo ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    private validate(props: ClienteProps): void {
        if (!props.nome || props.nome.trim().length === 0) {
            throw new Error('Nome do cliente é obrigatório');
        }

        if (!props.telefone || props.telefone.trim().length === 0) {
            throw new Error('Telefone é obrigatório');
        }

        if (props.cpf && !this.isValidCPF(props.cpf)) {
            throw new Error('CPF inválido');
        }

        if (props.email && !this.isValidEmail(props.email)) {
            throw new Error('Email inválido');
        }

        if (!props.empresaId) {
            throw new Error('Empresa é obrigatória');
        }
    }

    private isValidCPF(cpf: string): boolean {
        const cleaned = cpf.replace(/[^\d]/g, '');
        if (cleaned.length !== 11) return false;

        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cleaned)) return false;

        return true; // Simplificado - implementar validação completa em produção
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Getters
    get id(): string | undefined {
        return this.props.id;
    }

    get empresaId(): string {
        return this.props.empresaId;
    }

    get nome(): string {
        return this.props.nome;
    }

    get cpf(): string | undefined {
        return this.props.cpf;
    }

    get telefone(): string {
        return this.props.telefone;
    }

    get email(): string | undefined {
        return this.props.email;
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

    get dataNascimento(): Date | undefined {
        return this.props.dataNascimento;
    }

    get observacoes(): string | undefined {
        return this.props.observacoes;
    }

    get ativo(): boolean {
        return this.props.ativo ?? true;
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

    public atualizarDados(dados: Partial<ClienteProps>): void {
        if (dados.nome !== undefined) {
            if (!dados.nome || dados.nome.trim().length === 0) {
                throw new Error('Nome do cliente é obrigatório');
            }
            this.props.nome = dados.nome;
        }

        if (dados.telefone !== undefined) {
            if (!dados.telefone || dados.telefone.trim().length === 0) {
                throw new Error('Telefone é obrigatório');
            }
            this.props.telefone = dados.telefone;
        }

        if (dados.email !== undefined && dados.email && !this.isValidEmail(dados.email)) {
            throw new Error('Email inválido');
        }

        Object.assign(this.props, dados);
        this.props.updatedAt = new Date();
    }

    public toJSON(): ClienteProps {
        return { ...this.props };
    }
}
