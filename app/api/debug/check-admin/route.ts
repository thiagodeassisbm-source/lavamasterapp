import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Buscar todos os super admins
        const admins = await prisma.superAdmin.findMany()

        // Testar senha para cada admin
        const testPassword = 'admin123'
        const results = []

        for (const admin of admins) {
            const passwordMatch = await bcrypt.compare(testPassword, admin.senha)

            results.push({
                id: admin.id,
                email: admin.email,
                ativo: admin.ativo,
                senhaHash: admin.senha.substring(0, 20) + '...',
                passwordTestResult: passwordMatch ? '✅ MATCH' : '❌ NO MATCH',
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt
            })
        }

        return NextResponse.json({
            total: admins.length,
            admins: results,
            testPassword: testPassword
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
