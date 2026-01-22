import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET() {
    try {
        console.log('🔄 Iniciando Reset de Super Admin via Rota de Debug...')

        // 1. Gerar Hash
        const hash = await bcrypt.hash('admin123', 10)

        // 2. Tentar atualizar ou criar
        const admin = await prisma.superAdmin.upsert({
            where: { email: 'thiago.deassisbm@gmail.com' },
            update: {
                senha: hash,
                ativo: true
            },
            create: {
                id: 'superadmin-debug-001',
                nome: 'Super Admin Debug',
                email: 'thiago.deassisbm@gmail.com',
                senha: hash,
                ativo: true
            }
        })

        return NextResponse.json({
            message: '✅ Super Admin Resetado com Sucesso!',
            admin: {
                id: admin.id,
                email: admin.email,
                ativo: admin.ativo,
                novaSenha: 'admin123'
            }
        })

    } catch (error) {
        console.error('❌ Erro no reset:', error)
        return NextResponse.json({
            error: 'Erro ao resetar admin',
            details: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 })
    }
}
