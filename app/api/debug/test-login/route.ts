import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        console.log('🕵️‍♂️ Testando Login Internamente...')

        const emailAlvo = 'thiago.deassisbm@gmail.com'
        const senhaTeste = 'admin123'

        // 1. Buscar usuário
        const admin = await prisma.superAdmin.findFirst({
            where: { email: emailAlvo }
        })

        if (!admin) {
            return NextResponse.json({
                status: 'FAIL',
                message: 'Usuário NÃO ENCONTRADO no banco'
            })
        }

        // 2. Comparar senha manualmente
        const senhaValida = await bcrypt.compare(senhaTeste, admin.senha)

        return NextResponse.json({
            status: senhaValida ? 'SUCCESS' : 'FAIL',
            message: senhaValida ? '✅ LOGIN DEVE FUNCIONAR!' : '❌ SENHA INCORRETA NO BANCO',
            details: {
                email: admin.email,
                senhaTestada: senhaTeste,
                hashNoBanco: admin.senha.substring(0, 10) + '...',
                resultadoComparacao: senhaValida
            }
        })

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown' })
    }
}
