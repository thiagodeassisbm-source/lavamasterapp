import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const email = process.env.SUPERADMIN_EMAIL || 'thiago.deassisbm@gmail.com';
        const password = process.env.SUPERADMIN_PASSWORD || 'admin123';
        const rootEmpresaId = process.env.SUPERADMIN_EMPRESA_ID || 'superadmin-root';

        // Opcional: proteger em produção com cabeçalho secreto
        if (process.env.NODE_ENV === 'production' && process.env.INIT_SECRET) {
            const token = request.headers.get('x-init-secret');
            if (token !== process.env.INIT_SECRET) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        // Garantir empresa raiz para o superadmin
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.usuario.upsert({
            where: { email_empresaId: { email, empresaId: rootEmpresaId } },
            update: { senha: hashedPassword, ativo: true, role: 'superadmin' },
            create: {
                nome: 'Super Admin',
                email,
                senha: hashedPassword,
                ativo: true,
                role: 'superadmin',
                empresaId: rootEmpresaId
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Super Admin criado/atualizado com sucesso!',
            user: admin.email
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
