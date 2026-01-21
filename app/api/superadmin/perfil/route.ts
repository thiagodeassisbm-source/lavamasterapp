import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'lavamaster-secret-2026-production'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const token = authHeader.split(' ')[1]
        const decoded: any = jwt.verify(token, JWT_SECRET)

        const superAdmin = await prisma.superAdmin.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                nome: true,
                email: true,
                ativo: true
            }
        })

        if (!superAdmin) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

        return NextResponse.json(superAdmin)
    } catch (error) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const token = authHeader.split(' ')[1]
        const decoded: any = jwt.verify(token, JWT_SECRET)

        const { nome, email, senhaAtual, novaSenha } = await request.json()

        const superAdmin = await prisma.superAdmin.findUnique({
            where: { id: decoded.id }
        })

        if (!superAdmin) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

        // Se quiser mudar senha, precisa validar a atual
        const updateData: any = { nome, email }

        if (novaSenha) {
            if (!senhaAtual) {
                return NextResponse.json({ error: 'Senha atual é obrigatória para mudar a senha' }, { status: 400 })
            }
            const senhaValida = await bcrypt.compare(senhaAtual, superAdmin.senha)
            if (!senhaValida) {
                return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })
            }
            updateData.senha = await bcrypt.hash(novaSenha, 10)
        }

        const updated = await prisma.superAdmin.update({
            where: { id: decoded.id },
            data: updateData,
            select: {
                id: true,
                nome: true,
                email: true
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Erro ao atualizar perfil superadmin:', error)
        return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }
}
