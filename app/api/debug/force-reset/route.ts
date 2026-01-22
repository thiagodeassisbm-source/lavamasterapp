import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const email = 'thiago.deassisbm@gmail.com'
        const password = 'admin123'

        // 1. DELETAR TODOS os super admins
        const deleted = await prisma.superAdmin.deleteMany({})
        console.log(`🗑️ Deletados ${deleted.count} super admins`)

        // 2. Criar hash fresco
        const hashedPassword = await bcrypt.hash(password, 10)
        console.log(`🔐 Hash gerado: ${hashedPassword}`)

        // 3. Criar novo admin
        const newAdmin = await prisma.superAdmin.create({
            data: {
                id: `superadmin-${Date.now()}`,
                nome: 'Super Admin',
                email: email,
                senha: hashedPassword,
                ativo: true
            }
        })

        // 4. Testar imediatamente se a senha bate
        const testMatch = await bcrypt.compare(password, newAdmin.senha)

        return NextResponse.json({
            status: 'success',
            message: 'Super Admin criado do zero',
            admin: {
                id: newAdmin.id,
                email: newAdmin.email,
                ativo: newAdmin.ativo
            },
            credentials: {
                email,
                password
            },
            test: {
                hashInDb: newAdmin.senha.substring(0, 30) + '...',
                passwordMatch: testMatch ? '✅ PASSOU NO TESTE' : '❌ FALHOU NO TESTE'
            },
            deletedCount: deleted.count
        })
    } catch (error: any) {
        console.error('❌ Erro ao forçar reset:', error)
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
