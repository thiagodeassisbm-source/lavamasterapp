import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET() {
    const results = {
        step1_env: 'Checking Environment...',
        step2_connect: 'Pending...',
        step3_query: 'Pending...',
        error: null as any
    }

    try {
        // Step 1
        results.step1_env = process.env.DATABASE_URL ? 'DATABASE_URL exists (Hidden)' : 'DATABASE_URL MISSING ❌'

        // Step 2
        console.log('🔌 Tentando conectar ao banco...')
        await prisma.$connect()
        results.step2_connect = '✅ Conectado com sucesso!'

        // Step 3
        console.log('🔍 Executando query de teste...')
        const count = await prisma.superAdmin.count()
        results.step3_query = `✅ Query OK! Total SuperAdmins: ${count}`

        // Retornar sucesso
        return NextResponse.json({ status: 'OK', results })

    } catch (error) {
        console.error('❌ Erro de conexão:', error)
        results.error = {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }

        return NextResponse.json({ status: 'ERROR', results }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
}
