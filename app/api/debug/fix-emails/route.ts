import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const usuarios = await prisma.usuario.findMany()
        const empresas = await prisma.empresa.findMany()

        const updates = []

        for (const u of usuarios) {
            updates.push(
                prisma.usuario.update({
                    where: { id: u.id },
                    data: { email: u.email.toLowerCase().trim() }
                })
            )
        }

        for (const e of empresas) {
            updates.push(
                prisma.empresa.update({
                    where: { id: e.id },
                    data: { email: e.email.toLowerCase().trim() }
                })
            )
        }

        await Promise.all(updates)

        return NextResponse.json({ message: 'Todos os e-mails foram normalizados para minúsculas.' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
