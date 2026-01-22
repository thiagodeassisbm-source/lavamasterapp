import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const email = 'thiago.deassisbm@gmail.com'
        const password = 'admin123'
        const hashedPassword = await bcrypt.hash(password, 10)

        // Upsert Super Admin
        const user = await prisma.superAdmin.upsert({
            where: { email },
            update: {
                senha: hashedPassword,
                ativo: true,
                updatedAt: new Date()
            },
            create: {
                id: `superadmin-${Date.now()}`,
                nome: 'Super Admin',
                email,
                senha: hashedPassword,
                ativo: true
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
