import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'lavamaster-secret-2026-production';

export async function POST(request: NextRequest) {
    try {
        console.log('🔍 [SuperAdmin Login] Iniciando processo de login...');

        const body = await request.json();
        const email = body.email ? body.email.trim().toLowerCase() : '';
        const senha = body.senha;

        console.log('📥 [SuperAdmin Login] Tentativa:', {
            emailOriginal: body.email,
            emailNormalizado: email,
            senhaLength: senha?.length
        });

        if (!email || !senha) {
            console.log('⚠️ [SuperAdmin Login] Dados incompletos');
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios' },
                { status: 400 }
            );
        }

        // Buscar superadmin na tabela de usuários
        console.log('🔍 [SuperAdmin Login] Buscando no banco...');
        const superAdmin = await prisma.usuario.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                },
                role: 'superadmin'
            }
        });
        console.log('📊 [SuperAdmin Login] SuperAdmin encontrado:', superAdmin ? 'Sim' : 'Não');

        if (!superAdmin) {
            console.log('❌ [SuperAdmin Login] SuperAdmin não encontrado');
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        if (!superAdmin.ativo) {
            console.log('❌ [SuperAdmin Login] Conta desativada');
            return NextResponse.json(
                { error: 'Conta desativada' },
                { status: 403 }
            );
        }

        // Verificar senha
        console.log('🔍 [SuperAdmin Login] Verificando senha...');
        const senhaValida = await bcrypt.compare(senha, superAdmin.senha);
        console.log('🔐 [SuperAdmin Login] Senha válida:', senhaValida);

        if (!senhaValida) {
            console.log('❌ [SuperAdmin Login] Senha inválida');
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        // Gerar token JWT
        console.log('🔑 [SuperAdmin Login] Gerando token JWT...');
        const token = jwt.sign(
            {
                id: superAdmin.id,
                email: superAdmin.email,
                role: 'superadmin',
                empresaId: superAdmin.empresaId ?? null
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        console.log('✅ [SuperAdmin Login] Token gerado com sucesso');

        const response = {
            token,
            user: {
                id: superAdmin.id,
                nome: superAdmin.nome,
                email: superAdmin.email,
                role: 'superadmin'
            }
        };

        console.log('✅ [SuperAdmin Login] Login bem-sucedido para:', email);
        return NextResponse.json(response);
    } catch (error) {
        console.error('💥 [SuperAdmin Login] ERRO CRÍTICO:', error);
        console.error('💥 [SuperAdmin Login] Stack:', error instanceof Error ? error.stack : 'N/A');
        return NextResponse.json(
            { error: 'Erro ao fazer login', details: error instanceof Error ? error.message : 'Erro desconhecido' },
            { status: 500 }
        );
    }
}
