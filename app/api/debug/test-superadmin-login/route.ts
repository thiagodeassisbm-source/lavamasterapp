import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const email = body.email?.trim().toLowerCase() || ''
        const senha = body.senha || ''

        const diagnostics: any = {
            timestamp: new Date().toISOString(),
            input: {
                emailReceived: body.email,
                emailNormalized: email,
                senhaLength: senha.length
            },
            steps: []
        }

        // PASSO 1: Verificar se existe algum usuário com esse email
        diagnostics.steps.push('1. Buscando usuário por email...')
        const usuario = await prisma.usuario.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            }
        })

        if (!usuario) {
            diagnostics.steps.push('❌ Nenhum usuário encontrado com esse email')
            diagnostics.error = 'USUARIO_NAO_ENCONTRADO'
            return NextResponse.json(diagnostics, { status: 404 })
        }

        diagnostics.steps.push('✅ Usuário encontrado!')
        diagnostics.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            ativo: usuario.ativo,
            empresaId: usuario.empresaId,
            senhaHashPrefix: usuario.senha.substring(0, 20) + '...',
            senhaHashLength: usuario.senha.length
        }

        // PASSO 2: Verificar se é superadmin
        diagnostics.steps.push('2. Verificando role...')
        if (usuario.role !== 'superadmin') {
            diagnostics.steps.push(`❌ Usuário não é superadmin (role: ${usuario.role})`)
            diagnostics.error = 'NAO_E_SUPERADMIN'
            return NextResponse.json(diagnostics, { status: 403 })
        }
        diagnostics.steps.push('✅ Usuário é superadmin')

        // PASSO 3: Verificar se está ativo
        diagnostics.steps.push('3. Verificando se está ativo...')
        if (!usuario.ativo) {
            diagnostics.steps.push('❌ Usuário está desativado')
            diagnostics.error = 'USUARIO_DESATIVADO'
            return NextResponse.json(diagnostics, { status: 403 })
        }
        diagnostics.steps.push('✅ Usuário está ativo')

        // PASSO 4: Testar senha
        diagnostics.steps.push('4. Testando senha com bcrypt...')
        const senhaValida = await bcrypt.compare(senha, usuario.senha)

        if (!senhaValida) {
            diagnostics.steps.push('❌ Senha inválida!')
            diagnostics.error = 'SENHA_INVALIDA'
            diagnostics.bcryptTest = {
                inputPassword: senha,
                hashInDb: usuario.senha.substring(0, 30) + '...',
                match: false
            }
            return NextResponse.json(diagnostics, { status: 401 })
        }

        diagnostics.steps.push('✅ Senha válida!')
        diagnostics.bcryptTest = {
            match: true
        }

        // PASSO 5: Verificar JWT_SECRET
        diagnostics.steps.push('5. Verificando JWT_SECRET...')
        const jwtSecret = process.env.JWT_SECRET
        diagnostics.jwt = {
            hasSecret: !!jwtSecret,
            secretLength: jwtSecret?.length || 0
        }

        diagnostics.steps.push('✅ TODOS OS TESTES PASSARAM!')
        diagnostics.result = 'SUCCESS - Login deveria funcionar!'

        return NextResponse.json(diagnostics, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({
            error: 'EXCEPTION',
            message: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
