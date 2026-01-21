import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const admin = await prisma.superAdmin.upsert({
            where: { email: 'thiago.deassisbm@gmail.com' },
            update: { senha: 'admin123' },
            create: {
                nome: 'Thiago De Assis',
                email: 'thiago.deassisbm@gmail.com',
                senha: 'admin123',
                ativo: true
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Super Admin criado com sucesso!',
            user: admin.email
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
