import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'lavamaster-secret-2026-production'

export async function POST(request: NextRequest) {
    try {
        console.log('🔍 [SuperAdmin Login] Iniciando processo de login...')

        const body = await request.json()
        console.log('📥 [SuperAdmin Login] Body recebido:', { email: body.email, senhaLength: body.senha?.length })

        const { email, senha } = body

        if (!email || !senha) {
            console.log('⚠️ [SuperAdmin Login] Email ou senha não fornecidos')
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios' },
                { status: 400 }
            )
        }

        // Buscar Super Admin
        console.log('🔍 [SuperAdmin Login] Buscando superadmin com email:', email)
        const superAdmin = await prisma.superAdmin.findUnique({
            where: { email }
        })
        console.log('📊 [SuperAdmin Login] SuperAdmin encontrado:', superAdmin ? 'Sim' : 'Não')

        if (!superAdmin) {
            console.log('❌ [SuperAdmin Login] SuperAdmin não encontrado')
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            )
        }

        // Verificar se está ativo
        console.log('🔍 [SuperAdmin Login] Verificando se está ativo:', superAdmin.ativo)
        if (!superAdmin.ativo) {
            console.log('❌ [SuperAdmin Login] Conta desativada')
            return NextResponse.json(
                { error: 'Conta desativada' },
                { status: 403 }
            )
        }

        // Verificar senha
        console.log('🔍 [SuperAdmin Login] Verificando senha...')
        const senhaValida = await bcrypt.compare(senha, superAdmin.senha)
        console.log('🔐 [SuperAdmin Login] Senha válida:', senhaValida)

        if (!senhaValida) {
            console.log('❌ [SuperAdmin Login] Senha inválida')
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            )
        }

        // Gerar token JWT
        console.log('🔑 [SuperAdmin Login] Gerando token JWT...')
        const token = jwt.sign(
            {
                id: superAdmin.id,
                email: superAdmin.email,
                role: 'superadmin'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        )
        console.log('✅ [SuperAdmin Login] Token gerado com sucesso')

        const response = {
            token,
            user: {
                id: superAdmin.id,
                nome: superAdmin.nome,
                email: superAdmin.email,
                role: 'superadmin'
            }
        }

        console.log('✅ [SuperAdmin Login] Login bem-sucedido para:', email)
        return NextResponse.json(response)
    } catch (error) {
        console.error('💥 [SuperAdmin Login] ERRO CRÍTICO:', error)
        console.error('💥 [SuperAdmin Login] Stack:', error instanceof Error ? error.stack : 'N/A')
        return NextResponse.json(
            { error: 'Erro ao fazer login', details: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        )
    }
}
