/**
 * Entidade Usuario - Representa um usuário do sistema
 */

export interface UsuarioProps {
    id?: string;
    empresaId: string;
    nome: string;
    email: string;
    senha: string;
    role?: 'admin' | 'gerente' | 'usuario';
    ativo?: boolean;
    avatar?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Usuario {
    private props: UsuarioProps;

    constructor(props: UsuarioProps) {
        this.validate(props);
        this.props = {
            ...props,
            role: props.role ?? 'usuario',
            ativo: props.ativo ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    private validate(props: UsuarioProps): void {
        if (!props.nome || props.nome.trim().length === 0) {
            throw new Error('Nome do usuário é obrigatório');
        }

        if (!props.email || !this.isValidEmail(props.email)) {
            throw new Error('Email inválido');
        }

        if (!props.empresaId) {
            throw new Error('Empresa é obrigatória');
        }
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

    get email(): string {
        return this.props.email;
    }

    get senha(): string {
        return this.props.senha;
    }

    get role(): 'admin' | 'gerente' | 'usuario' {
        return this.props.role ?? 'usuario';
    }

    get ativo(): boolean {
        return this.props.ativo ?? true;
    }

    get avatar(): string | undefined {
        return this.props.avatar;
    }

    // Métodos de negócio
    public isAdmin(): boolean {
        return this.props.role === 'admin';
    }

    public isGerente(): boolean {
        return this.props.role === 'gerente';
    }

    public hasPermission(permission: string): boolean {
        if (this.isAdmin()) return true;
        if (this.isGerente() && permission !== 'manage_users') return true;
        return false;
    }

    public ativar(): void {
        this.props.ativo = true;
        this.props.updatedAt = new Date();
    }

    public desativar(): void {
        this.props.ativo = false;
        this.props.updatedAt = new Date();
    }

    public atualizarSenha(novaSenha: string): void {
        if (!novaSenha || novaSenha.length < 6) {
            throw new Error('Senha deve ter no mínimo 6 caracteres');
        }
        this.props.senha = novaSenha;
        this.props.updatedAt = new Date();
    }

    public toJSON(): Omit<UsuarioProps, 'senha'> {
        const { senha, ...rest } = this.props;
        return rest;
    }

    public toJSONWithPassword(): UsuarioProps {
        return { ...this.props };
    }
}
