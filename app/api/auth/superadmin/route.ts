import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'lavamaster-secret-2026-production'

export async function POST(request: NextRequest) {
    try {
        const { email, senha } = await request.json()

        // Buscar Super Admin
        const superAdmin = await prisma.superAdmin.findUnique({
            where: { email }
        })

        if (!superAdmin) {
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            )
        }

        // Verificar se está ativo
        if (!superAdmin.ativo) {
            return NextResponse.json(
                { error: 'Conta desativada' },
                { status: 403 }
            )
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, superAdmin.senha)
        if (!senhaValida) {
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            )
        }

        // Gerar token JWT
        const token = jwt.sign(
            {
                id: superAdmin.id,
                email: superAdmin.email,
                role: 'superadmin'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        return NextResponse.json({
            token,
            user: {
                id: superAdmin.id,
                nome: superAdmin.nome,
                email: superAdmin.email,
                role: 'superadmin'
            }
        })
    } catch (error) {
        console.error('Erro no login do Super Admin:', error)
        return NextResponse.json(
            { error: 'Erro ao fazer login' },
            { status: 500 }
        )
    }
}
