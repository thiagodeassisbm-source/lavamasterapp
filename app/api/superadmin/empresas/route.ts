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

// GET - Listar todas as empresas
export async function GET(request: NextRequest) {
    try {
        verifySuperAdmin(request)

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') // 'ativo', 'bloqueado', 'expirado'

        const skip = (page - 1) * limit

        // Filtros
        const where: any = {}

        if (search) {
            where.OR = [
                { nome: { contains: search } },
                { cnpj: { contains: search } },
                { email: { contains: search } }
            ]
        }

        if (status === 'ativo') {
            where.ativo = true
            where.bloqueado = false
        } else if (status === 'bloqueado') {
            where.bloqueado = true
        } else if (status === 'expirado') {
            where.dataExpiracao = { lt: new Date() }
        }

        const [empresas, total] = await Promise.all([
            prisma.empresa.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            usuarios: true,
                            clientes: true,
                            agendamentos: true
                        }
                    }
                }
            }),
            prisma.empresa.count({ where })
        ])

        return NextResponse.json({
            empresas,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error: any) {
        console.error('Erro ao listar empresas:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao listar empresas' },
            { status: error.message === 'Acesso negado' ? 403 : 500 }
        )
    }
}

// POST - Criar nova empresa + Usuário Admin
export async function POST(request: NextRequest) {
    try {
        verifySuperAdmin(request)

        const data = await request.json()

        // Validar CNPJ único
        const empresaExistente = await prisma.empresa.findUnique({
            where: { cnpj: data.cnpj }
        })

        if (empresaExistente) {
            return NextResponse.json(
                { error: 'CNPJ já cadastrado' },
                { status: 400 }
            )
        }

        if (!data.senha) {
            return NextResponse.json(
                { error: 'A senha do administrador é obrigatória' },
                { status: 400 }
            )
        }

        // Criar Empresa e Usuário em uma transação
        const result = await prisma.$transaction(async (tx) => {
            // @ts-ignore
            const novaEmpresa = await tx.empresa.create({
                data: {
                    nome: data.nome,
                    cnpj: data.cnpj,
                    email: data.email?.trim().toLowerCase(),
                    telefone: data.telefone,
                    plano: data.plano || 'Basico',
                    planoId: data.planoId,
                    valorMensal: parseFloat(data.valorMensal) || 0,
                    dataContratacao: data.dataContratacao ? new Date(data.dataContratacao) : new Date(),
                    dataExpiracao: data.dataExpiracao ? new Date(data.dataExpiracao) : null,
                    limiteUsuarios: parseInt(data.limiteUsuarios) || 5,
                    limiteClientes: parseInt(data.limiteClientes) || 100,
                    limiteAgendamentos: parseInt(data.limiteAgendamentos) || 1000,
                    observacoesInternas: data.observacoesInternas
                }
            })

            const hashedPassword = await bcrypt.hash(data.senha, 10)

            await tx.usuario.create({
                data: {
                    empresaId: novaEmpresa.id,
                    nome: data.nome, // Usando o nome da empresa como nome inicial do admin
                    email: data.email?.trim().toLowerCase(),
                    senha: hashedPassword,
                    role: 'admin',
                    ativo: true
                }
            })

            return novaEmpresa
        })

        return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
        console.error('Erro ao criar empresa:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao criar empresa' },
            { status: error.message === 'Acesso negado' ? 403 : 500 }
        )
    }
}
