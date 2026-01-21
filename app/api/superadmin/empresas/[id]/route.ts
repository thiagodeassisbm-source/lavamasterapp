import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'lavamaster-secret-2026-production'

// Middleware para verificar se é Super Admin
function verifySuperAdmin(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
        throw new Error('Token não fornecido')
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.role !== 'superadmin') {
        throw new Error('Acesso negado')
    }

    return decoded
}

// GET - Buscar empresa por ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        verifySuperAdmin(request)

        // @ts-ignore
        const empresa = await prisma.empresa.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: {
                        usuarios: true,
                        clientes: true,
                        agendamentos: true,
                        vendas: true,
                        servicos: true,
                        produtos: true
                    }
                },
                usuarios: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        role: true,
                        ativo: true,
                        createdAt: true
                    }
                },
                planoRel: true
            }
        })

        if (!empresa) {
            return NextResponse.json(
                { error: 'Empresa não encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(empresa)
    } catch (error: any) {
        console.error('Erro ao buscar empresa:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar empresa' },
            { status: error.message === 'Acesso negado' ? 403 : 500 }
        )
    }
}

// PUT - Atualizar empresa
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        verifySuperAdmin(request)

        const data = await request.json()

        // 1. Atualizar dados da empresa
        // @ts-ignore
        const empresa = await prisma.empresa.update({
            where: { id: params.id },
            data: {
                nome: data.nome,
                cnpj: data.cnpj,
                email: data.email?.trim().toLowerCase(),
                telefone: data.telefone,
                endereco: data.endereco,
                cidade: data.cidade,
                estado: data.estado,
                cep: data.cep,
                plano: data.plano,
                planoId: data.planoId || null,
                valorMensal: parseFloat(data.valorMensal) || 0,
                ativo: data.ativo,
                bloqueado: data.bloqueado,
                motivoBloqueio: data.motivoBloqueio,
                dataExpiracao: data.dataExpiracao ? new Date(data.dataExpiracao) : null,
                proximoVencimento: data.proximoVencimento ? new Date(data.proximoVencimento) : null,
                limiteUsuarios: parseInt(data.limiteUsuarios) || 0,
                limiteClientes: parseInt(data.limiteClientes) || 0,
                limiteAgendamentos: parseInt(data.limiteAgendamentos) || 0,
                observacoesInternas: data.observacoesInternas
            }
        })

        // 2. Se enviou senhaAdmin, atualizar ou CRIAR o administrador principal
        if (data.senhaAdmin) {
            const hashedPassword = await bcrypt.hash(data.senhaAdmin, 10)

            // Busca o usuário admin desta empresa
            const admin = await prisma.usuario.findFirst({
                where: {
                    empresaId: params.id,
                    role: 'admin'
                }
            })

            if (admin) {
                // Se existe, atualiza senha e e-mail (para garantir que use o e-mail atual da empresa)
                await prisma.usuario.update({
                    where: { id: admin.id },
                    data: {
                        senha: hashedPassword,
                        email: data.email?.trim().toLowerCase()
                    }
                })
            } else {
                // Se NÃO existe nenhum admin, cria o primeiro agora!
                await prisma.usuario.create({
                    data: {
                        empresaId: params.id,
                        nome: data.nome,
                        email: data.email?.trim().toLowerCase(),
                        senha: hashedPassword,
                        role: 'admin',
                        ativo: true
                    }
                })
            }
        }

        return NextResponse.json(empresa)
    } catch (error: any) {
        console.error('Erro ao atualizar empresa:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar empresa' },
            { status: error.message === 'Acesso negado' ? 403 : 500 }
        )
    }
}

// DELETE - Deletar empresa
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        verifySuperAdmin(request)

        await prisma.empresa.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Empresa deletada com sucesso' })
    } catch (error: any) {
        console.error('Erro ao deletar empresa:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao deletar empresa' },
            { status: error.message === 'Acesso negado' ? 403 : 500 }
        )
    }
}

// PATCH - Bloquear/Desbloquear empresa
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        verifySuperAdmin(request)

        const { bloqueado, motivoBloqueio } = await request.json()

        // @ts-ignore
        const empresa = await prisma.empresa.update({
            where: { id: params.id },
            data: {
                bloqueado,
                motivoBloqueio: bloqueado ? motivoBloqueio : null
            }
        })

        return NextResponse.json(empresa)
    } catch (error: any) {
        console.error('Erro ao bloquear/desbloquear empresa:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao bloquear/desbloquear empresa' },
            { status: error.message === 'Acesso negado' ? 403 : 500 }
        )
    }
}
