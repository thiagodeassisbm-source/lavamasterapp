import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
    try {
        console.log('☢️ [HARD RESET] Iniciando Reset Completo de Super Admin...')

        const emailAlvo = 'thiago.deassisbm@gmail.com'

        // 1. Remover TODOS com esse email
        const deleted = await prisma.superAdmin.deleteMany({
            where: { email: emailAlvo }
        })
        console.log(`🗑️ Removidos ${deleted.count} registros antigos.`)

        // 2. Gerar Hash NOVO
        const hash = await bcrypt.hash('admin123', 10)

        // 3. Criar do zero
        const admin = await prisma.superAdmin.create({
            data: {
                id: `superadmin-reset-${Date.now()}`,
                nome: 'Super Administrator',
                email: emailAlvo,
                senha: hash,
                ativo: true
            }
        })

        console.log('✅ Novo Super Admin criado:', admin.id)

        return NextResponse.json({
            status: 'SUCCESS',
            message: 'Usuário recriado do zero.',
            details: {
                email: admin.email,
                senhaDefinida: 'admin123',
                id: admin.id,
                registrosAntigosRemovidos: deleted.count
            }
        })

    } catch (error) {
        console.error('❌ Erro no hard reset:', error)
        return NextResponse.json({
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
