/**
 * Entidade Agendamento - Representa um agendamento de serviço
 */

export interface AgendamentoProps {
    id?: string;
    empresaId: string;
    clienteId: string;
    veiculoId?: string;
    usuarioId?: string;
    dataHora: Date;
    status?: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado';
    observacoes?: string;
    valorTotal?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Agendamento {
    private props: AgendamentoProps;

    constructor(props: AgendamentoProps) {
        this.validate(props);
        this.props = {
            ...props,
            status: props.status ?? 'agendado',
            valorTotal: props.valorTotal ?? 0,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        };
    }

    private validate(props: AgendamentoProps): void {
        if (!props.empresaId) {
            throw new Error('Empresa é obrigatória');
        }

        if (!props.clienteId) {
            throw new Error('Cliente é obrigatório');
        }

        if (!props.dataHora) {
            throw new Error('Data e hora são obrigatórias');
        }

        if (props.dataHora < new Date()) {
            throw new Error('Não é possível agendar para uma data passada');
        }
    }

    // Getters
    get id(): string | undefined {
        return this.props.id;
    }

    get empresaId(): string {
        return this.props.empresaId;
    }

    get clienteId(): string {
        return this.props.clienteId;
    }

    get veiculoId(): string | undefined {
        return this.props.veiculoId;
    }

    get usuarioId(): string | undefined {
        return this.props.usuarioId;
    }

    get dataHora(): Date {
        return this.props.dataHora;
    }

    get status(): 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' {
        return this.props.status ?? 'agendado';
    }

    get observacoes(): string | undefined {
        return this.props.observacoes;
    }

    get valorTotal(): number {
        return this.props.valorTotal ?? 0;
    }

    // Métodos de negócio
    public confirmar(): void {
        if (this.props.status === 'cancelado') {
            throw new Error('Não é possível confirmar um agendamento cancelado');
        }
        this.props.status = 'confirmado';
        this.props.updatedAt = new Date();
    }

    public iniciar(): void {
        if (this.props.status !== 'confirmado' && this.props.status !== 'agendado') {
            throw new Error('Apenas agendamentos confirmados podem ser iniciados');
        }
        this.props.status = 'em_andamento';
        this.props.updatedAt = new Date();
    }

    public concluir(): void {
        if (this.props.status !== 'em_andamento') {
            throw new Error('Apenas agendamentos em andamento podem ser concluídos');
        }
        this.props.status = 'concluido';
        this.props.updatedAt = new Date();
    }

    public cancelar(): void {
        if (this.props.status === 'concluido') {
            throw new Error('Não é possível cancelar um agendamento concluído');
        }
        this.props.status = 'cancelado';
        this.props.updatedAt = new Date();
    }

    public reagendar(novaDataHora: Date): void {
        if (novaDataHora < new Date()) {
            throw new Error('Não é possível reagendar para uma data passada');
        }
        if (this.props.status === 'concluido' || this.props.status === 'cancelado') {
            throw new Error('Não é possível reagendar um agendamento concluído ou cancelado');
        }
        this.props.dataHora = novaDataHora;
        this.props.status = 'agendado';
        this.props.updatedAt = new Date();
    }

    public atribuirProfissional(usuarioId: string): void {
        this.props.usuarioId = usuarioId;
        this.props.updatedAt = new Date();
    }

    public atualizarValor(valor: number): void {
        if (valor < 0) {
            throw new Error('Valor não pode ser negativo');
        }
        this.props.valorTotal = valor;
        this.props.updatedAt = new Date();
    }

    public isPendente(): boolean {
        return this.props.status === 'agendado' || this.props.status === 'confirmado';
    }

    public isEmAndamento(): boolean {
        return this.props.status === 'em_andamento';
    }

    public isConcluido(): boolean {
        return this.props.status === 'concluido';
    }

    public isCancelado(): boolean {
        return this.props.status === 'cancelado';
    }

    public toJSON(): AgendamentoProps {
        return { ...this.props };
    }
}
