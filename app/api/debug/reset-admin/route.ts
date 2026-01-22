import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const email = process.env.SUPERADMIN_EMAIL || 'thiago.deassisbm@gmail.com'
        const password = process.env.SUPERADMIN_PASSWORD || 'admin123'
        const rootEmpresaId = process.env.SUPERADMIN_EMPRESA_ID || 'superadmin-root'
        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.empresa.upsert({
            where: { id: rootEmpresaId },
            update: {},
            create: {
                id: rootEmpresaId,
                nome: 'Superadmin Root',
                cnpj: '00000000000000-root',
                email,
                plano: 'root',
                limiteUsuarios: 10,
                limiteClientes: 1000,
                limiteAgendamentos: 10000,
                ativo: true,
            }
        })

        // Upsert Super Admin na tabela de usuários
        const user = await prisma.usuario.upsert({
            where: { email_empresaId: { email, empresaId: rootEmpresaId } },
            update: {
                senha: hashedPassword,
                ativo: true,
                role: 'superadmin',
                updatedAt: new Date()
            },
            create: {
                id: `superadmin-${Date.now()}`,
                nome: 'Super Admin',
                email,
                senha: hashedPassword,
                ativo: true,
                role: 'superadmin',
                empresaId: rootEmpresaId
            }
        })

        return NextResponse.json({
            status: 'success',
            message: 'Super Admin reset/created successfully',
            credentials: {
                email,
                password
            },
            user_id: user.id
        })
    } catch (error: any) {
        console.error('Reset Admin Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
