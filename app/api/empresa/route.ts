import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'lavamaster-secret-2026-production'

function getUserFromToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
        throw new Error('Token não fornecido')
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
}

// GET - Buscar dados da empresa do usuário logado
export async function GET(request: NextRequest) {
    try {
        console.log('=== API /api/empresa GET ===')
        const user = getUserFromToken(request)
        console.log('User decoded:', user)

        // Buscar usuário com empresa (JWT usa 'sub' para o ID)
        const usuario = await prisma.usuario.findUnique({
            where: { id: user.sub },
            include: {
                empresa: true
            }
        })

        console.log('Usuario encontrado:', usuario ? 'Sim' : 'Não')
        console.log('Empresa:', usuario?.empresa?.nome)

        if (!usuario || !usuario.empresa) {
            return NextResponse.json(
                { error: 'Empresa não encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(usuario.empresa)
    } catch (error: any) {
        console.error('❌ Erro ao buscar empresa:', error)
        console.error('Erro detalhado:', error.message, error.stack)
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar empresa' },
            { status: 500 }
        )
    }
}

// PUT - Atualizar dados da empresa
export async function PUT(request: NextRequest) {
    try {
        const user = getUserFromToken(request)
        const data = await request.json()

        // Buscar usuário para pegar o empresaId (JWT usa 'sub' para o ID)
        const usuario = await prisma.usuario.findUnique({
            where: { id: user.sub }
        })

        if (!usuario) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // Atualizar empresa
        const empresa = await prisma.empresa.update({
            where: { id: usuario.empresaId },
            data: {
                nome: data.nome,
                cnpj: data.cnpj,
                email: data.email,
                telefone: data.telefone,
                endereco: data.endereco,
                cidade: data.cidade,
                estado: data.estado,
                cep: data.cep,
                logo: data.logo
            }
        })

        return NextResponse.json(empresa)
    } catch (error: any) {
        console.error('Erro ao atualizar empresa:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar empresa' },
            { status: 500 }
        )
    }
}
