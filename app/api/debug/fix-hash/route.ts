import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        console.log('🔧 Corrigindo hash da senha...')

        const emailAlvo = 'thiago.deassisbm@gmail.com'

        // 1. Gerar hash correto (agora SIM usando bcrypt)
        const hashCorreto = await bcrypt.hash('admin123', 10)

        // 2. Atualizar no banco
        const admin = await prisma.superAdmin.update({
            where: { email: emailAlvo },
            data: { senha: hashCorreto }
        })

        return NextResponse.json({
            status: 'FIXED',
            message: '✅ Hash corrigido com sucesso!',
            details: {
                id: admin.id,
                email: admin.email,
                novoHashInicio: hashCorreto.substring(0, 15) + '...'
            }
        })

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
    }
}
