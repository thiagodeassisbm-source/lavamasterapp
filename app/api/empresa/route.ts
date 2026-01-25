import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthContext } from '@/lib/auth'

// GET - Buscar dados da empresa do usuário logado
export async function GET(request: NextRequest) {
    try {
        console.log('=== API /api/empresa GET ===')
        const auth = await getAuthContext()

        if (!auth || !auth.userId) {
            console.error('[API Empresa] Usuário não identificado no contexto');
            return NextResponse.json({ error: 'Não autorizado ou ID ausente' }, { status: 401 })
        }

        console.log('Auth context:', auth)

        // Buscar usuário com empresa
        const usuario = await prisma.usuario.findUnique({
            where: { id: auth.userId },
            include: {
                empresa: true
            }
        })

        console.log('Usuario encontrado:', usuario ? 'Sim' : 'Não')
        console.log('Empresa:', usuario?.empresa?.nome)

        if (!usuario || !usuario.empresa) {
            return NextResponse.json(
                { error: 'Empresa não encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json(usuario.empresa)
    } catch (error: any) {
        console.error('❌ Erro ao buscar empresa:', error)
        console.error('Erro detalhado:', error.message, error.stack)
        return NextResponse.json(
            { error: error.message || 'Erro ao buscar empresa' },
            { status: 500 }
        )
    }
}

// PUT - Atualizar dados da empresa
export async function PUT(request: NextRequest) {
    try {
        const auth = await getAuthContext()

        if (!auth) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const data = await request.json()

        // Buscar usuário para pegar o empresaId
        const usuario = await prisma.usuario.findUnique({
            where: { id: auth.userId }
        })

        if (!usuario) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        if (!usuario.empresaId) {
            return NextResponse.json(
                { error: 'Este usuário não possui uma empresa vinculada' },
                { status: 400 }
            )
        }

        // Atualizar empresa
        const empresa = await prisma.empresa.update({
            where: { id: usuario.empresaId },
            data: {
                nome: data.nome,
                cnpj: data.cnpj,
                email: data.email,
                telefone: data.telefone,
                endereco: data.endereco,
                cidade: data.cidade,
                estado: data.estado,
                cep: data.cep,
                logo: data.logo
            }
        })

        return NextResponse.json(empresa)
    } catch (error: any) {
        console.error('Erro ao atualizar empresa:', error)
        return NextResponse.json(
            { error: error.message || 'Erro ao atualizar empresa' },
            { status: 500 }
        )
    }
}
