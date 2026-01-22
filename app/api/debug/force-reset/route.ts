import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const resetSecret = process.env.RESET_SECRET;
        const email = process.env.SUPERADMIN_EMAIL || 'thiago.deassisbm@gmail.com';
        const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
        const rootEmpresaId = process.env.SUPERADMIN_EMPRESA_ID || 'superadmin-root';

        if (resetSecret) {
            const token = request.headers.get('x-reset-secret') || url.searchParams.get('token');
            if (token !== resetSecret) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Garantir empresa raiz
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
        });

        // Delete all super admins (na tabela de usuários)
        const deleted = await prisma.usuario.deleteMany({
            where: { role: 'superadmin' }
        });

        // Create fresh hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new admin
        const newAdmin = await prisma.usuario.create({
            data: {
                id: `superadmin-${Date.now()}`,
                nome: 'Super Admin',
                email,
                senha: hashedPassword,
                ativo: true,
                role: 'superadmin',
                empresaId: rootEmpresaId
            },
        });

        // Test hash match
        const testMatch = await bcrypt.compare(password, newAdmin.senha);

        return NextResponse.json({
            status: 'success',
            message: 'Super Admin criado do zero',
            admin: {
                id: newAdmin.id,
                email: newAdmin.email,
                ativo: newAdmin.ativo,
            },
            credentials: { email, password },
            test: {
                hashInDb: newAdmin.senha.substring(0, 30) + '...',
                passwordMatch: testMatch ? 'OK' : 'FAIL',
            },
            deletedCount: deleted.count,
        });
    } catch (error: any) {
        console.error('Erro ao forcar reset:', error);
        return NextResponse.json(
            { error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
